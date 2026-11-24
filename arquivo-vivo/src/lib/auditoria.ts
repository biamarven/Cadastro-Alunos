import { sql } from "@/lib/db";

function comoTexto(valor: unknown): string | null {
	if (valor === null || valor === undefined) return null;
	if (typeof valor === "object") return JSON.stringify(valor);
	return String(valor);
}

export async function registrarAuditoria(
	usuarioId: number | string,
	acao: string,
	entidade: string,
	entidadeId: number | string,
	valoresNovos: Record<string, unknown>,
	valoresAnteriores: Record<string, unknown> = {},
) {
	const campos = Array.from(new Set([...Object.keys(valoresNovos), ...Object.keys(valoresAnteriores)]));
	const anteriores = campos.map((campo) => comoTexto(valoresAnteriores[campo]));
	const novos = campos.map((campo) => comoTexto(valoresNovos[campo]));

	await sql`
		with novo_log as (
			insert into log_auditoria (usuario_id, acao, entidade, entidade_id)
			values (
				${String(usuarioId)}::bigint,
				${acao}::text,
				${entidade}::text,
				${String(entidadeId)}::bigint
			)
			returning id
		)
		insert into log_auditoria_campo (log_auditoria_id, campo, valor_anterior, valor_novo)
		select novo_log.id, dados.campo, dados.valor_anterior, dados.valor_novo
		from novo_log
		cross join unnest(${campos}::text[], ${anteriores}::text[], ${novos}::text[]) as dados(campo, valor_anterior, valor_novo)
	`;
}