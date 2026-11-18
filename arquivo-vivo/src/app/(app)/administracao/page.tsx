import Link from "next/link";
import { Titulo } from "@/components/ui";

const secoes = [
	{ titulo: "Usuários", desc: "Crie, edite e desative contas de acesso.", href: "/administracao/usuarios" },
	{ titulo: "Permissões", desc: "Defina o que cada perfil pode ver e editar.", href: "/administracao/permissoes" },
	{ titulo: "Instituição e regras", desc: "Dados da instituição, regra de notas e períodos letivos.", href: "/administracao/instituicao" },
	{ titulo: "Auditoria", desc: "Registro de quem fez o quê e quando.", href: "/administracao/auditoria" },
];

export default function AdministracaoPage() {
	return (
		<>
			<Titulo titulo="Administração" sub="Configurações do sistema" />
			<div className="grid gap-4 md:grid-cols-2">
				{secoes.map((s) => (
					<Link key={s.titulo} href={s.href} className="rounded-lg border border-linha bg-cartao p-5 transition hover:border-vermelho">
						<p className="font-serif text-lg font-bold">{s.titulo}</p>
						<p className="mt-1 text-sm text-suave">{s.desc}</p>
					</Link>
				))}
			</div>
		</>
	);
}