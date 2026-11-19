"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { criarSessao, encerrarSessao } from "@/lib/sessao";
import type { Permissoes } from "@/lib/permissoes";

const ERRO_GENERICO = "E-mail ou senha incorretos.";

export async function entrar(
	email: string,
	senha: string
): Promise<{ erro: string } | undefined> {
	const usuarios = await sql`
		select
			usuario.id,
			usuario.nome,
			usuario.senha_hash,
			usuario.situacao,
			usuario.perfil_id,
			perfil.nome as perfil
		from usuario
		join perfil on (
			perfil.id = usuario.perfil_id
		)
		where 1=1
		and lower(usuario.email) = lower(${email.trim()})
	`;

	const usuario = usuarios[0];

	if (!usuario || !usuario.senha_hash) {
		return { erro: ERRO_GENERICO };
	}

	const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);

	if (!senhaConfere) {
		return { erro: ERRO_GENERICO };
	}

	if (usuario.situacao !== "ativo") {
		return { erro: "Este usuário está desativado. Fale com o administrador." };
	}

	const linhas = await sql`
		select
			modulo.nome as modulo,
			perfil_permissao.nivel
		from perfil_permissao
		join modulo on (
			modulo.id = perfil_permissao.modulo_id
		)
		where 1=1
		and perfil_permissao.perfil_id = ${usuario.perfil_id}
	`;

	const permissoes: Permissoes = {};
	for (const linha of linhas) {
		permissoes[linha.modulo] = linha.nivel;
	}

	await sql`
		update usuario
		set ultimo_acesso_em = now()
		where 1=1
		and id = ${usuario.id}
	`;

	await criarSessao({
		usuarioId: String(usuario.id),
		nome: usuario.nome,
		perfil: usuario.perfil,
		permissoes,
	});

	redirect("/inicio");
}

export async function sair() {
	await encerrarSessao();
	redirect("/login");
}