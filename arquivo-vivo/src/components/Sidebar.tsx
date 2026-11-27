"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/app/login/actions";
import { podeAcessar } from "@/lib/permissoes";
import type { Permissoes } from "@/lib/permissoes";
import BotaoDebug from "@/components/BotaoDebug";

const itens = [
	{ href: "/inicio", nome: "Início", modulo: null },
	{ href: "/alunos", nome: "Alunos", modulo: "Alunos" },
	{ href: "/cursos", nome: "Cursos e turmas", modulo: "Cursos e turmas" },
	{ href: "/notas", nome: "Notas", modulo: "Notas" },
	{ href: "/administracao", nome: "Administração", modulo: "Administração" },
];

export default function Sidebar({
	nome,
	perfil,
	permissoes,
}: {
	nome: string;
	perfil: string;
	permissoes: Permissoes;
}) {
	const caminho = usePathname();
	const visiveis = itens.filter((i) => i.modulo === null || podeAcessar(permissoes, i.modulo));

	return (
		<aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-lateral text-stone-300">
			<div className="px-6 py-6 font-serif text-xl font-bold text-white">
				Arquivo <span className="text-vermelho">Vivo</span>
			</div>
			<nav className="flex-1 space-y-1 px-3">
				{visiveis.map((i) => {
					const ativo = caminho.startsWith(i.href);
					return (
						<Link
							key={i.href}
							href={i.href}
							className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
								ativo ? "bg-vermelho text-white" : "hover:bg-white/10"
							}`}
						>
							{i.nome}
						</Link>
					);
				})}
			</nav>
			<div className="border-t border-white/10 p-4 text-sm">
				<p className="font-semibold text-white">{nome}</p>
				<p className="text-xs text-stone-400">{perfil}</p>
				<div className="mt-3 flex items-center gap-4">
					<Link
						href="/conta/senha"
						className={`text-xs hover:text-white ${caminho.startsWith("/conta/senha") ? "text-white" : "text-stone-400"}`}
					>
						Trocar senha
					</Link>
					<form action={sair}>
						<button type="submit" className="text-xs text-stone-400 hover:text-white">
							Sair
						</button>
					</form>
				</div>
				{perfil === "Administrador" && (
					<div className="mt-2">
						<BotaoDebug />
					</div>
				)}
			</div>
		</aside>
	);
}