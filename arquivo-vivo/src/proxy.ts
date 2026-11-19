import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NOME_COOKIE, verificarToken } from "@/lib/sessao";
import { moduloDaRota, podeAcessar } from "@/lib/permissoes";

export async function proxy(request: NextRequest) {
	const token = request.cookies.get(NOME_COOKIE)?.value;
	const sessao = token ? await verificarToken(token) : null;
	const caminho = request.nextUrl.pathname;
	const ehLogin = caminho === "/login";
	const ehConvite = caminho.startsWith("/convite/");

	if (ehConvite) {
		return NextResponse.next();
	}

	if (!sessao && !ehLogin) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (sessao && ehLogin) {
		return NextResponse.redirect(new URL("/inicio", request.url));
	}

	if (sessao) {
		const modulo = moduloDaRota(caminho);
		if (modulo && !podeAcessar(sessao.permissoes, modulo)) {
			return NextResponse.redirect(new URL("/inicio", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};