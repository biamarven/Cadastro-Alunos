"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";

type Resultado = {
	erro?: string;
	id?: string;
	form?: Record<string, string>;
	passo?: number;
};

function limpar(dados: unknown): Record<string, string> {
	const saida: Record<string, string> = {};
	if (typeof dados !== "object" || dados === null) return saida;
	for (const [chave, valor] of Object.entries(dados as Record<string, unknown>).slice(0, 40)) {
		if (typeof valor === "string") saida[chave.slice(0, 40)] = valor.slice(0, 300);
	}
	return saida;
}

export async function salvarRascunho(
	id: string | null,
	form: Record<string, string>,
	passo: number,
	totalEtapas: number,
): Promise<Resultado> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para salvar rascunhos." };
	}

	if (!Number.isInteger(passo) || passo < 0 || passo > 10) return { erro: "Etapa inválida." };
	if (totalEtapas !== 4 && totalEtapas !== 5) return { erro: "Número de etapas inválido." };

	const dados = limpar(form);
	const nome = (dados.nome ?? "").trim().slice(0, 150);
	const etapa = Math.min(passo + 1, totalEtapas);
	const usuarioId = String(sessao.usuarioId);

	if (id !== null && /^\d+$/.test(id)) {
		const atualizados = await sql`
			update cadastro_rascunho
			set
				nome_aluno = ${nome === "" ? null : nome}::text,
				etapa_atual = ${etapa}::smallint,
				total_etapas = ${totalEtapas}::smallint,
				dados = ${JSON.stringify(dados)}::jsonb,
				atualizado_em = now()
			where 1=1
			and id = ${id}::bigint
			and criado_por = ${usuarioId}::bigint
			returning id::text as id
		`;
		if (atualizados.length > 0) {
			revalidatePath("/alunos/rascunhos");
			return { id: String(atualizados[0].id) };
		}
	}

	const novos = await sql`
		insert into cadastro_rascunho (criado_por, nome_aluno, etapa_atual, total_etapas, dados)
		values (
			${usuarioId}::bigint,
			${nome === "" ? null : nome}::text,
			${etapa}::smallint,
			${totalEtapas}::smallint,
			${JSON.stringify(dados)}::jsonb
		)
		returning id::text as id
	`;
	revalidatePath("/alunos/rascunhos");
	return { id: String(novos[0].id) };
}

export async function carregarRascunho(id: string): Promise<Resultado> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para abrir rascunhos." };
	}
	if (!/^\d+$/.test(id)) return { erro: "Rascunho inválido." };

	const linhas = await sql`
		select id::text as id, etapa_atual, dados
		from cadastro_rascunho
		where 1=1
		and id = ${id}::bigint
		and criado_por = ${String(sessao.usuarioId)}::bigint
	`;
	if (linhas.length === 0) return { erro: "Rascunho não encontrado." };

	return {
		id: String(linhas[0].id),
		form: limpar(linhas[0].dados),
		passo: Math.max(Number(linhas[0].etapa_atual) - 1, 0),
	};
}

export async function descartarRascunho(id: string): Promise<void> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return;
	}
	if (!/^\d+$/.test(id)) return;

	await sql`
		delete from cadastro_rascunho
		where 1=1
		and id = ${id}::bigint
		and criado_por = ${String(sessao.usuarioId)}::bigint
	`;
	revalidatePath("/alunos/rascunhos");
}