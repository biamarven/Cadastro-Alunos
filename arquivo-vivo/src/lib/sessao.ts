import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Permissoes } from "@/lib/permissoes";

export const NOME_COOKIE = "av_sessao";
const DURACAO_HORAS = 8;

export type Sessao = {
	usuarioId: string;
	nome: string;
	perfil: string;
	permissoes: Permissoes;
};

function chave() {
	const segredo = process.env.SESSION_SECRET;
	if (!segredo) {
		throw new Error("SESSION_SECRET não está definida");
	}
	return new TextEncoder().encode(segredo);
}

export async function verificarToken(token: string): Promise<Sessao | null> {
	try {
		const { payload } = await jwtVerify(token, chave());
		return {
			usuarioId: String(payload.usuarioId),
			nome: String(payload.nome),
			perfil: String(payload.perfil),
			permissoes: (payload.permissoes ?? {}) as Permissoes,
		};
	} catch {
		return null;
	}
}

export async function criarSessao(dados: Sessao) {
	const token = await new SignJWT({ ...dados })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${DURACAO_HORAS}h`)
		.sign(chave());

	const jar = await cookies();
	jar.set(NOME_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: DURACAO_HORAS * 60 * 60,
	});
}

export async function lerSessao(): Promise<Sessao | null> {
	const jar = await cookies();
	const token = jar.get(NOME_COOKIE)?.value;
	if (!token) {
		return null;
	}
	return verificarToken(token);
}

export async function encerrarSessao() {
	const jar = await cookies();
	jar.delete(NOME_COOKIE);
}