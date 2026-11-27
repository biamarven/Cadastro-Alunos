"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

type Linha = { moduloId: string; nivel: string; escopo: string; justificativa: boolean };

const NIVEIS = ["sem_acesso", "ver", "editar"];
const ESCOPOS = ["todos", "curso", "turmas"];

export async function salvarPermissoes(perfilId: string, linhas: Linha[]): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Administração", true);
	} catch {
		return { erro: "Você não tem permissão para alterar permissões." };
	}

	if (!/^\d+$/.test(perfilId)) return { erro: "Perfil inválido." };
	if (!Array.isArray(linhas) || linhas.length === 0 || linhas.length > 50) return { erro: "Dados inválidos." };

	const perfis = await sql`
		select nome
		from perfil
		where 1=1
		and id = ${perfilId}::bigint
	`;
	if (perfis.length === 0) return { erro: "Perfil não encontrado." };
	const nomePerfil = String(perfis[0].nome);

	const modulos = await sql`
		select id::text as id, nome
		from modulo
	`;
	const nomeModulo = new Map<string, string>();
	for (const m of modulos) nomeModulo.set(String(m.id), String(m.nome));

	const unicas = new Map<string, Linha>();
	for (const l of linhas) {
		if (!nomeModulo.has(l.moduloId)) return { erro: "Módulo inválido." };
		if (!NIVEIS.includes(l.nivel) || !ESCOPOS.includes(l.escopo)) return { erro: "Nível ou escopo inválido." };
		if (
			nomePerfil === "Administrador" &&
			nomeModulo.get(l.moduloId) === "Administração" &&
			(l.nivel !== "editar" || l.escopo !== "todos")
		) {
			return { erro: "O perfil Administrador precisa manter acesso total à Administração." };
		}
		unicas.set(l.moduloId, { ...l, justificativa: Boolean(l.justificativa) });
	}
	const lista = Array.from(unicas.values());

	const atuais = await sql`
		select modulo_id::text as modulo_id, nivel, escopo, exige_justificativa
		from perfil_permissao
		where 1=1
		and perfil_id = ${perfilId}::bigint
	`;
	const antigas = new Map<string, { nivel: string; escopo: string; justificativa: boolean }>();
	for (const a of atuais) {
		antigas.set(String(a.modulo_id), {
			nivel: String(a.nivel),
			escopo: String(a.escopo),
			justificativa: Boolean(a.exige_justificativa),
		});
	}

	const anteriores: Record<string, string | null> = {};
	const alterados: Record<string, string | null> = {};
	for (const l of lista) {
		const antigo = antigas.get(l.moduloId);
		const nome = nomeModulo.get(l.moduloId) ?? l.moduloId;
		if (!antigo || antigo.nivel !== l.nivel) {
			anteriores[`${nome} · nivel`] = antigo ? antigo.nivel : null;
			alterados[`${nome} · nivel`] = l.nivel;
		}
		if (!antigo || antigo.escopo !== l.escopo) {
			anteriores[`${nome} · escopo`] = antigo ? antigo.escopo : null;
			alterados[`${nome} · escopo`] = l.escopo;
		}
		if (!antigo || antigo.justificativa !== l.justificativa) {
			anteriores[`${nome} · justificativa`] = antigo ? String(antigo.justificativa) : null;
			alterados[`${nome} · justificativa`] = String(l.justificativa);
		}
	}
	if (Object.keys(alterados).length === 0) return {};

	try {
		await sql`
			insert into perfil_permissao (perfil_id, modulo_id, nivel, escopo, exige_justificativa)
			select ${perfilId}::bigint, dados.modulo, dados.nivel, dados.escopo, dados.justificativa
			from unnest(
				${lista.map((l) => l.moduloId)}::bigint[],
				${lista.map((l) => l.nivel)}::text[],
				${lista.map((l) => l.escopo)}::text[],
				${lista.map((l) => l.justificativa)}::boolean[]
			) as dados(modulo, nivel, escopo, justificativa)
			on conflict (perfil_id, modulo_id) do update set
				nivel = excluded.nivel,
				escopo = excluded.escopo,
				exige_justificativa = excluded.exige_justificativa
		`;
	} catch {
		return { erro: "Não foi possível salvar as permissões." };
	}

	await registrarAuditoria(sessao.usuarioId, "editar", "perfil_permissao", perfilId, alterados, anteriores);

	revalidatePath("/administracao/permissoes");
	return {};
}