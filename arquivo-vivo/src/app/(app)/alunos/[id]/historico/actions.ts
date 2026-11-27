"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

export async function emitirHistorico(
	matriculaId: string,
	tipo: string,
): Promise<{ erro?: string; codigo?: string; emitidoEm?: string }> {
	const acesso = await permissaoAtual("Histórico acadêmico");
	if (!acesso.sessao || (acesso.nivel !== "ver" && acesso.nivel !== "editar")) {
		return { erro: "Você não tem permissão para emitir o histórico." };
	}
	if (!/^\d+$/.test(matriculaId)) return { erro: "Matrícula inválida." };
	if (tipo !== "completo" && tipo !== "somente_concluidos") return { erro: "Tipo de histórico inválido." };

	const matriculas = await sql`
		select aluno_id::text as aluno_id
		from matricula
		where 1=1
		and id = ${matriculaId}::bigint
	`;
	if (matriculas.length === 0) return { erro: "Matrícula não encontrada." };
	const alunoId = String(matriculas[0].aluno_id);

	const hex = randomBytes(10).toString("hex").toUpperCase();
	const codigo = `AV-${(hex.match(/.{4}/g) ?? []).join("-")}`;

	let emissao;
	try {
		emissao = await sql`
			insert into emissao_historico (matricula_id, tipo, com_assinatura_digital, com_qrcode, codigo_autenticacao, emitido_por)
			values (
				${matriculaId}::bigint,
				${tipo}::text,
				false,
				false,
				${codigo}::text,
				${String(acesso.sessao.usuarioId)}::bigint
			)
			returning
				id::text as id,
				to_char(emitido_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as emitido_em
		`;
	} catch {
		return { erro: "Não foi possível registrar a emissão." };
	}

	await registrarAuditoria(acesso.sessao.usuarioId, "emitir", "emissao_historico", String(emissao[0].id), {
		matricula_id: matriculaId,
		tipo,
		codigo,
	});

	revalidatePath(`/alunos/${alunoId}/historico`);
	return { codigo, emitidoEm: String(emissao[0].emitido_em) };
}