import { sql } from "@/lib/db";

export async function registrarAuditoria(
	usuarioId: string,
	acao: string,
	entidade: string,
	entidadeId: string | null,
	valoresNovos: unknown
) {
	await sql`
		insert into log_auditoria (usuario_id, acao, entidade, entidade_id, valores_novos)
		values (${usuarioId}, ${acao}, ${entidade}, ${entidadeId}, ${JSON.stringify(valoresNovos)}::jsonb)
	`;
}