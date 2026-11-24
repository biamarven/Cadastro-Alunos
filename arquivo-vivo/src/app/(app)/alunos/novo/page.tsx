import { sql } from "@/lib/db";
import NovoAlunoCliente from "./NovoAlunoCliente";

export const dynamic = "force-dynamic";

export default async function NovoAlunoPage() {
	const cursos = await sql`
		select nome
		from curso
		where 1=1
		and situacao <> 'inativo'
		order by nome
	`;

	const periodos = await sql`
		select codigo, atual
		from periodo_letivo
		where 1=1
		order by ano desc, semestre desc
	`;

	const turmas = await sql`
		select
			turma.id,
			turma.codigo,
			curso.nome as curso,
			periodo_letivo.codigo as periodo,
			turma.turno,
			turma.vagas,
			(
				select count(*)
				from matricula_turma
				where 1=1
				and matricula_turma.turma_id = turma.id
			) as matriculados
		from turma
		join curso on (
			curso.id = turma.curso_id
		)
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		where 1=1
		and turma.situacao = 'aberta'
		order by turma.codigo
	`;

	return (
		<NovoAlunoCliente
			cursos={cursos.map((c) => c.nome)}
			periodos={periodos.map((p) => ({ codigo: p.codigo, atual: Boolean(p.atual) }))}
			turmas={turmas.map((t) => ({
				id: String(t.id),
				codigo: t.codigo,
				curso: t.curso,
				periodo: t.periodo,
				turno: t.turno,
				vagasLivres: Number(t.vagas) - Number(t.matriculados),
			}))}
		/>
	);
}