import Link from "next/link";
import { Cartao, Chip, Titulo, tomSituacao } from "@/components/ui";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import { situacoesMatricula } from "@/lib/rotulos";

export const dynamic = "force-dynamic";

function liberado(nivel: unknown) {
	return nivel === "ver" || nivel === "editar";
}

export default async function InicioPage() {
	const [alunosAcesso, cursosAcesso, notasAcesso, cadastroAcesso, historicoAcesso] = await Promise.all([
		permissaoAtual("Alunos"),
		permissaoAtual("Cursos e turmas"),
		permissaoAtual("Notas"),
		permissaoAtual("Cadastro de alunos"),
		permissaoAtual("Histórico acadêmico"),
	]);

	const usuarioId = String(notasAcesso.sessao?.usuarioId ?? "0");
	const escopoNotas = String(notasAcesso.escopo);

	const verAlunos = liberado(alunosAcesso.nivel);
	const verCursos = liberado(cursosAcesso.nivel);
	const verNotas = liberado(notasAcesso.nivel);

	const resumo = await sql`
		select
			(
				select count(distinct matricula.aluno_id)
				from matricula
				where 1=1
				and matricula.situacao = 'ativa'
			) as alunos_ativos,
			(
				select count(*)
				from turma
				where 1=1
				and turma.situacao = 'aberta'
			) as turmas_abertas,
			(
				select count(*)
				from matricula_disciplina
				join matricula on (
					matricula.id = matricula_disciplina.matricula_id
				)
				join oferta_disciplina on (
					oferta_disciplina.id = matricula_disciplina.oferta_disciplina_id
				)
				join turma on (
					turma.id = oferta_disciplina.turma_id
				)
				join curso on (
					curso.id = turma.curso_id
				)
				where 1=1
				and matricula.situacao = 'ativa'
				and matricula_disciplina.situacao = 'em_andamento'
				and oferta_disciplina.encerrada = false
				and (
					${escopoNotas}::text = 'todos' or
					(${escopoNotas}::text = 'turmas' and oferta_disciplina.professor_id = ${usuarioId}::bigint) or
					(${escopoNotas}::text = 'curso' and curso.coordenador_id = ${usuarioId}::bigint)
				)
			) as notas_pendentes,
			(
				select round(avg(matricula_disciplina.media), 1)::float8
				from matricula_disciplina
				join oferta_disciplina on (
					oferta_disciplina.id = matricula_disciplina.oferta_disciplina_id
				)
				join turma on (
					turma.id = oferta_disciplina.turma_id
				)
				join curso on (
					curso.id = turma.curso_id
				)
				where 1=1
				and matricula_disciplina.media is not null
				and (
					${escopoNotas}::text = 'todos' or
					(${escopoNotas}::text = 'turmas' and oferta_disciplina.professor_id = ${usuarioId}::bigint) or
					(${escopoNotas}::text = 'curso' and curso.coordenador_id = ${usuarioId}::bigint)
				)
			) as media_geral
	`;
	const r = resumo[0];

	const numeros = [
		{ mostrar: verAlunos, rotulo: "Alunos ativos", valor: Number(r.alunos_ativos).toLocaleString("pt-BR") },
		{ mostrar: verCursos, rotulo: "Turmas abertas", valor: Number(r.turmas_abertas).toLocaleString("pt-BR") },
		{ mostrar: verNotas, rotulo: "Notas pendentes", valor: Number(r.notas_pendentes).toLocaleString("pt-BR") },
		{
			mostrar: verNotas,
			rotulo: "Média geral",
			valor: r.media_geral === null ? "—" : String(r.media_geral).replace(".", ","),
		},
	].filter((n) => n.mostrar);

	const atalhos = [
		{
			mostrar: notasAcesso.nivel === "editar",
			titulo: "Lançar notas",
			desc: "Escolha turma e disciplina e lance as notas.",
			href: "/notas",
		},
		{
			mostrar: cadastroAcesso.nivel === "editar",
			titulo: "Novo aluno",
			desc: "Cadastro em etapas, com responsável para menores.",
			href: "/alunos/novo",
		},
		{
			mostrar: cursosAcesso.nivel === "editar" && cursosAcesso.escopo === "todos",
			titulo: "Novo curso",
			desc: "Cadastre curso, carga horária e turnos.",
			href: "/cursos",
		},
		{
			mostrar: liberado(historicoAcesso.nivel),
			titulo: "Emitir histórico",
			desc: "Escolha o aluno e emita o histórico escolar.",
			href: "/alunos",
		},
	].filter((a) => a.mostrar);

	const ultimos = verAlunos
		? await sql`
			select
				aluno.id::text as id,
				aluno.nome_completo,
				matricula.numero,
				curso.nome as curso,
				matricula.situacao
			from matricula
			join aluno on (
				aluno.id = matricula.aluno_id
			)
			join curso on (
				curso.id = matricula.curso_id
			)
			where 1=1
			order by matricula.criado_em desc, matricula.id desc
			limit 4
		`
		: [];

	return (
		<>
			<Titulo titulo="Início" sub="Bem-vindo de volta. Aqui está o resumo de hoje." />

			{numeros.length > 0 && (
				<div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{numeros.map((n) => (
						<Cartao key={n.rotulo}>
							<p className="text-xs font-semibold uppercase tracking-wide text-suave">{n.rotulo}</p>
							<p className="mt-2 font-serif text-4xl font-bold">{n.valor}</p>
						</Cartao>
					))}
				</div>
			)}

			{atalhos.length > 0 && (
				<>
					<h2 className="mb-3 font-serif text-xl font-bold">Atalhos</h2>
					<div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{atalhos.map((a) => (
							<Link key={a.titulo} href={a.href} className="rounded-lg border border-linha bg-cartao p-5 transition hover:border-vermelho">
								<p className="font-serif text-lg font-bold">{a.titulo}</p>
								<p className="mt-1 text-sm text-suave">{a.desc}</p>
							</Link>
						))}
					</div>
				</>
			)}

			{verAlunos && (
				<Cartao titulo="Últimos alunos cadastrados">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase text-suave">
								<th className="pb-2">Aluno</th><th className="pb-2">Matrícula</th><th className="pb-2">Curso</th><th className="pb-2">Situação</th>
							</tr>
						</thead>
						<tbody>
							{ultimos.map((a) => (
								<tr key={`${a.id}-${a.numero}`} className="border-t border-linha">
									<td className="py-2">
										<Link className="font-medium hover:text-vermelho" href={`/alunos/${a.id}`}>{String(a.nome_completo)}</Link>
									</td>
									<td className="py-2 font-mono text-xs">{String(a.numero)}</td>
									<td className="py-2">{String(a.curso)}</td>
									<td className="py-2">
										<Chip tom={tomSituacao(situacoesMatricula[String(a.situacao)] ?? String(a.situacao))}>
											{situacoesMatricula[String(a.situacao)] ?? String(a.situacao)}
										</Chip>
									</td>
								</tr>
							))}
							{ultimos.length === 0 && (
								<tr>
									<td colSpan={4} className="py-6 text-center text-suave">Nenhum aluno cadastrado ainda.</td>
								</tr>
							)}
						</tbody>
					</table>
				</Cartao>
			)}
		</>
	);
}