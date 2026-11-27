import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import PermissoesCliente from "./PermissoesCliente";

export const dynamic = "force-dynamic";

export default async function PermissoesPage() {
	const acesso = await permissaoAtual("Administração");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") notFound();

	const perfis = await sql`
		select id::text as id, nome
		from perfil
		order by id
	`;

	const modulos = await sql`
		select id::text as id, nome
		from modulo
		order by id
	`;

	const linhas = await sql`
		select perfil_id::text as perfil_id, modulo_id::text as modulo_id, nivel, escopo, exige_justificativa
		from perfil_permissao
	`;

	const permissoes: Record<string, { nivel: string; escopo: string; justificativa: boolean }> = {};
	for (const l of linhas) {
		permissoes[`${l.perfil_id}:${l.modulo_id}`] = {
			nivel: String(l.nivel),
			escopo: String(l.escopo),
			justificativa: Boolean(l.exige_justificativa),
		};
	}

	return (
		<PermissoesCliente
			podeEditar={acesso.nivel === "editar"}
			perfis={perfis.map((p) => ({ id: String(p.id), nome: String(p.nome) }))}
			modulos={modulos.map((m) => ({ id: String(m.id), nome: String(m.nome) }))}
			permissoes={permissoes}
		/>
	);
}