import Link from "next/link";
import { Cartao, Chip, Titulo, tomSituacao } from "@/components/ui";
import { alunos } from "@/lib/mock";

const numeros = [
	{ rotulo: "Alunos ativos", valor: "1.248" },
	{ rotulo: "Turmas abertas", valor: "36" },
	{ rotulo: "Notas pendentes", valor: "142" },
	{ rotulo: "Média geral", valor: "7,4" },
];

const atalhos = [
	{ titulo: "Lançar notas", desc: "Escolha turma e disciplina e lance N1, N2 e N3.", href: "/notas" },
	{ titulo: "Novo aluno", desc: "Cadastro em etapas, com responsável para menores.", href: "/alunos/novo" },
	{ titulo: "Novo curso", desc: "Cadastre curso, carga horária e turnos.", href: "/cursos" },
	{ titulo: "Emitir histórico", desc: "Escolha o aluno e emita o histórico escolar.", href: "/alunos" },
];

export default function InicioPage() {
	return (
		<>
			<Titulo titulo="Início" sub="Bem-vindo de volta. Aqui está o resumo de hoje." />

			<div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{numeros.map((n) => (
					<Cartao key={n.rotulo}>
						<p className="text-xs font-semibold uppercase tracking-wide text-suave">{n.rotulo}</p>
						<p className="mt-2 font-serif text-4xl font-bold">{n.valor}</p>
					</Cartao>
				))}
			</div>

			<h2 className="mb-3 font-serif text-xl font-bold">Atalhos</h2>
			<div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{atalhos.map((a) => (
					<Link key={a.titulo} href={a.href} className="rounded-lg border border-linha bg-cartao p-5 transition hover:border-vermelho">
						<p className="font-serif text-lg font-bold">{a.titulo}</p>
						<p className="mt-1 text-sm text-suave">{a.desc}</p>
					</Link>
				))}
			</div>

			<Cartao titulo="Últimos alunos cadastrados">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Aluno</th><th className="pb-2">Matrícula</th><th className="pb-2">Curso</th><th className="pb-2">Situação</th>
						</tr>
					</thead>
					<tbody>
						{alunos.slice(0, 4).map((a) => (
							<tr key={a.id} className="border-t border-linha">
								<td className="py-2"><Link className="font-medium hover:text-vermelho" href={`/alunos/${a.id}`}>{a.nome}</Link></td>
								<td className="py-2 font-mono text-xs">{a.matricula}</td>
								<td className="py-2">{a.curso}</td>
								<td className="py-2"><Chip tom={tomSituacao(a.situacao)}>{a.situacao}</Chip></td>
							</tr>
						))}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}