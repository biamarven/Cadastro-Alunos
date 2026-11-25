import Link from "next/link";
import { notFound } from "next/navigation";
import { Titulo, classeBotao } from "@/components/ui";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import CursoDisciplinasCliente from "./CursoDisciplinasCliente";

export const dynamic = "force-dynamic";

export default async function CursoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const acesso = await permissaoAtual("Cursos e turmas");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") notFound();
	const podeEditar = acesso.nivel === "editar" && acesso.escopo === "todos";

	const cursos = await sql`
		select id::text as id, codigo, nome, duracao_semestres
		from curso
		where 1=1
		and id = ${id}::bigint
	`;
	if (cursos.length === 0) notFound();

	const matriz = await sql`
		select
			curso_disciplina.id::text as id,
			disciplina.nome,
			curso_disciplina.periodo,
			curso_disciplina.carga_horaria,
			curso_disciplina.tipo
		from curso_disciplina
		join disciplina on (
			disciplina.id = curso_disciplina.disciplina_id
		)
		where 1=1
		and curso_disciplina.curso_id = ${id}::bigint
		order by curso_disciplina.periodo, disciplina.nome
	`;

	const turmas = await sql`
		select
			turma.id::text as id,
			turma.codigo,
			turma.periodo_curso,
			turma.turno,
			periodo_letivo.codigo as periodo
		from turma
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		where 1=1
		and turma.curso_id = ${id}::bigint
		order by periodo_letivo.codigo desc, turma.codigo
	`;

	const ofertas = await sql`
		select
			oferta_disciplina.id::text as id,
			oferta_disciplina.turma_id::text as turma_id,
			oferta_disciplina.curso_disciplina_id::text as curso_disciplina_id,
			disciplina.nome as disciplina,
			coalesce(oferta_disciplina.professor_id::text, '') as professor_id
		from oferta_disciplina
		join turma on (
			turma.id = oferta_disciplina.turma_id
		)
		join curso_disciplina on (
			curso_disciplina.id = oferta_disciplina.curso_disciplina_id
		)
		join disciplina on (
			disciplina.id = curso_disciplina.disciplina_id
		)
		where 1=1
		and turma.curso_id = ${id}::bigint
		order by disciplina.nome
	`;

	const professores = await sql`
		select usuario.id::text as id, usuario.nome
		from usuario
		join perfil on (
			perfil.id = usuario.perfil_id
		)
		where 1=1
		and perfil.nome = 'Professor'
		and usuario.situacao = 'ativo'
		order by usuario.nome
	`;

	const c = cursos[0];

	return (
		<>
			<Titulo titulo={`${c.codigo} · ${c.nome}`} sub="Matriz curricular e ofertas de disciplinas por turma.">
				<Link href="/cursos" className={classeBotao("claro")}>Voltar para cursos</Link>
			</Titulo>
			<CursoDisciplinasCliente
				curso={{ id: String(c.id), duracao: Number(c.duracao_semestres) }}
				podeEditar={podeEditar}
				matriz={matriz.map((m) => ({
					id: String(m.id),
					nome: String(m.nome),
					periodo: Number(m.periodo),
					carga: Number(m.carga_horaria),
					tipo: String(m.tipo),
				}))}
				turmas={turmas.map((t) => ({
					id: String(t.id),
					codigo: String(t.codigo),
					periodoCurso: Number(t.periodo_curso),
					turno: String(t.turno),
					periodo: String(t.periodo),
				}))}
				ofertas={ofertas.map((o) => ({
					id: String(o.id),
					turmaId: String(o.turma_id),
					cursoDisciplinaId: String(o.curso_disciplina_id),
					disciplina: String(o.disciplina),
					professorId: String(o.professor_id),
				}))}
				professores={professores.map((p) => ({ id: String(p.id), nome: String(p.nome) }))}
			/>
		</>
	);
}