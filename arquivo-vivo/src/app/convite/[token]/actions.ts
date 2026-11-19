"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { sql } from "@/lib/db";

export async function aceitarConvite(
	token: string,
	senha: string
): Promise<{ erro?: string; ok?: boolean }> {
	if (senha.length < 8) {
		return { erro: "A senha precisa ter ao menos 8 caracteres." };
	}

	const hash = crypto.createHash("sha256").update(token).digest("hex");

	const usuarios = await sql`
		select id
		from usuario
		where 1=1
		and convite_token_hash = ${hash}
		and convite_expira_em > now()
		and situacao = 'ativo'
	`;

	if (usuarios.length === 0) {
		return { erro: "Convite inválido ou expirado. Peça um novo link ao administrador." };
	}

	const senhaHash = await bcrypt.hash(senha, 12);

	await sql`
		update usuario
		set
			senha_hash = ${senhaHash},
			convite_token_hash = null,
			convite_expira_em = null,
			atualizado_em = now()
		where 1=1
		and id = ${usuarios[0].id}
	`;

	return { ok: true };
}