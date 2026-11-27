import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import CursosCliente from "./CursosCliente";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
	const permissao = await permissaoAtual("Cursos e turmas");
	const podeEditar = permissao.nivel === "editar" && permissao.escopo === "todos";

	const cursos = await sql`
		select
			curso.id,
			curso.codigo,
			curso.nome,
			curso.nivel,
			curso.modalidade,
			curso.carga_horaria_total,
			curso.duracao_semestres,
			curso.vagas_por_turma,
			curso.situacao,
			curso.coordenador_id::text as coordenador_id,
			coalesce((
				select string_agg(curso_turno.turno, ',' order by curso_turno.turno)
				from curso_turno
				where 1=1
				and curso_turno.curso_id = curso.id
			), '') as turnos,
			(
				select count(*)
				from matricula
				where 1=1
				and matricula.curso_id = curso.id
				and matricula.situacao = 'ativa'
			) as alunos,
			(
				select count(*)
				from turma
				where 1=1
				and turma.curso_id = curso.id
			) as turmas
		from curso
		where 1=1
		order by curso.nome
	`;

	const usuarios = await sql`
		select id::text as id, nome
		from usuario
		where 1=1
		order by nome
	`;

	const periodos = await sql`
		select id, codigo, atual
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
			turma.situacao,
			(
				select count(*)
				from matricula_turma
				where 1=1
				and matricula_turma.turma_id = turma.id
			) as matriculados,
			coalesce((
				select string_agg(distinct usuario.nome, ', ')
				from oferta_disciplina
				join usuario on (
					usuario.id = oferta_disciplina.professor_id
				)
				where 1=1
				and oferta_disciplina.turma_id = turma.id
			), '') as professores
		from turma
		join curso on (
			curso.id = turma.curso_id
		)
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		where 1=1
		order by periodo_letivo.ano desc, periodo_letivo.semestre desc, turma.codigo
	`;

	return (
		<CursosCliente
			podeEditar={podeEditar}
			usuarios={usuarios.map((u) => ({ id: String(u.id), nome: String(u.nome) }))}
			cursos={cursos.map((c) => ({
				id: String(c.id),
				codigo: c.codigo,
				nome: c.nome,
				nivel: c.nivel,
				modalidade: c.modalidade,
				carga: Number(c.carga_horaria_total),
				duracao: Number(c.duracao_semestres),
				vagasPorTurma: c.vagas_por_turma === null ? null : Number(c.vagas_por_turma),
				situacao: c.situacao,
				turnos: c.turnos ? String(c.turnos).split(",") : [],
				alunos: Number(c.alunos),
				turmas: Number(c.turmas),
				coordenadorId: c.coordenador_id === null ? null : String(c.coordenador_id),
			}))}
			periodos={periodos.map((p) => ({
				id: String(p.id),
				codigo: p.codigo,
				atual: Boolean(p.atual),
			}))}
			turmas={turmas.map((t) => ({
				id: String(t.id),
				codigo: t.codigo,
				curso: t.curso,
				periodo: t.periodo,
				turno: t.turno,
				vagas: Number(t.vagas),
				matriculados: Number(t.matriculados),
				professores: t.professores,
				situacao: t.situacao,
			}))}
		/>
	);
}