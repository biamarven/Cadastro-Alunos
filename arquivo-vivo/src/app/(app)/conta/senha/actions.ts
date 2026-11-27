"use server";

import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { lerSessao } from "@/lib/sessao";
import { registrarAuditoria } from "@/lib/auditoria";

export async function trocarSenha(atual: string, nova: string, confirmacao: string): Promise<{ erro?: string }> {
	const sessao = await lerSessao();
	if (!sessao) {
		return { erro: "Sessão expirada. Entre novamente." };
	}

	if (nova.length < 8) {
		return { erro: "A nova senha deve ter pelo menos 8 caracteres." };
	}
	if (nova.length > 72) {
		return { erro: "A nova senha deve ter no máximo 72 caracteres." };
	}
	if (nova !== confirmacao) {
		return { erro: "A confirmação não é igual à nova senha." };
	}
	if (nova === atual) {
		return { erro: "A nova senha precisa ser diferente da atual." };
	}

	const usuarios = await sql`
		select senha_hash
		from usuario
		where 1=1
		and id = ${sessao.usuarioId}::bigint
		and situacao = 'ativo'
	`;

	const hashAtual = usuarios[0]?.senha_hash;
	if (!hashAtual) {
		return { erro: "Não foi possível trocar a senha deste usuário." };
	}

	const confere = await bcrypt.compare(atual, String(hashAtual));
	if (!confere) {
		return { erro: "A senha atual está incorreta." };
	}

	const novoHash = await bcrypt.hash(nova, 10);

	await sql`
		update usuario
		set senha_hash = ${novoHash}
		where 1=1
		and id = ${sessao.usuarioId}::bigint
	`;

	await registrarAuditoria(sessao.usuarioId, "trocar_senha", "usuario", sessao.usuarioId, { senha: "alterada" });

	return {};
}