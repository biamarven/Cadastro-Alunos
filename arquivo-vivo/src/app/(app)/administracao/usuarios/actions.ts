"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";

type Resultado = { erro?: string; convite?: string };

function novoToken() {
	const token = crypto.randomBytes(32).toString("base64url");
	const hash = crypto.createHash("sha256").update(token).digest("hex");
	return { token, hash };
}

export async function salvarUsuario(dados: {
	id: string;
	nome: string;
	email: string;
	perfil: string;
	ativo: boolean;
}): Promise<Resultado> {
	const sessao = await exigirEdicao("Administração");

	const nome = dados.nome.trim();
	const email = dados.email.trim();

	if (!nome || !email.includes("@")) {
		return { erro: "Informe um nome e um e-mail válidos." };
	}

	const perfis = await sql`
		select id
		from perfil
		where 1=1
		and nome = ${dados.perfil}
	`;

	if (perfis.length === 0) {
		return { erro: "Perfil inválido." };
	}

	const repetidos = await sql`
		select id
		from usuario
		where 1=1
		and lower(email) = lower(${email})
		and id <> ${dados.id || "0"}
	`;

	if (repetidos.length > 0) {
		return { erro: "Já existe um usuário com esse e-mail." };
	}

	if (dados.id) {
		if (dados.id === sessao.usuarioId && (!dados.ativo || dados.perfil !== "Administrador")) {
			return { erro: "Você não pode desativar nem rebaixar o seu próprio usuário." };
		}

		await sql`
			update usuario
			set
				nome = ${nome},
				email = ${email},
				perfil_id = ${perfis[0].id},
				situacao = ${dados.ativo ? "ativo" : "inativo"},
				atualizado_em = now()
			where 1=1
			and id = ${dados.id}
		`;

		revalidatePath("/administracao/usuarios");
		return {};
	}

	const { token, hash } = novoToken();

	await sql`
		insert into usuario (nome, email, perfil_id, convite_token_hash, convite_expira_em)
		values (${nome}, ${email}, ${perfis[0].id}, ${hash}, now() + interval '7 days')
	`;

	revalidatePath("/administracao/usuarios");
	return { convite: `/convite/${token}` };
}

export async function gerarConvite(id: string): Promise<Resultado> {
	await exigirEdicao("Administração");

	const { token, hash } = novoToken();

	await sql`
		update usuario
		set
			convite_token_hash = ${hash},
			convite_expira_em = now() + interval '7 days',
			atualizado_em = now()
		where 1=1
		and id = ${id}
	`;

	revalidatePath("/administracao/usuarios");
	return { convite: `/convite/${token}` };
}