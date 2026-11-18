"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
	{ href: "/inicio", nome: "Início" },
	{ href: "/alunos", nome: "Alunos" },
	{ href: "/cursos", nome: "Cursos e turmas" },
	{ href: "/notas", nome: "Notas" },
	{ href: "/administracao", nome: "Administração" },
];

export default function Sidebar() {
	const caminho = usePathname();
	return (
		<aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-lateral text-stone-300">
			<div className="px-6 py-6 font-serif text-xl font-bold text-white">
				Arquivo <span className="text-vermelho">Vivo</span>
			</div>
			<nav className="flex-1 space-y-1 px-3">
				{itens.map((i) => {
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
				<p className="font-semibold text-white">Gabriel Souza</p>
				<p className="text-xs text-stone-400">Administrador</p>
				<Link href="/login" className="mt-3 inline-block text-xs text-stone-400 hover:text-white">
					Sair
				</Link>
			</div>
		</aside>
	);
}