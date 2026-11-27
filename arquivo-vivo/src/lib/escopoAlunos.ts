import { sql } from "@/lib/db";

export async function alunoNoEscopo(alunoId: string, escopo: string, usuarioId: string): Promise<boolean> {
	if (escopo === "todos") return true;
	if (escopo !== "curso" && escopo !== "turmas") return false;

	const linhas = await sql`
		select count(*)::int as total
		from matricula
		join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		and matricula.aluno_id = ${alunoId}::bigint
		and (
			(
				${escopo}::text = 'curso' and
				curso.coordenador_id = ${usuarioId}::bigint
			)
			or
			(
				${escopo}::text = 'turmas' and
				exists (
					select 1
					from matricula_disciplina
					join oferta_disciplina on (
						oferta_disciplina.id = matricula_disciplina.oferta_disciplina_id
					)
					where 1=1
					and matricula_disciplina.matricula_id = matricula.id
					and oferta_disciplina.professor_id = ${usuarioId}::bigint
				)
			)
		)
	`;

	return Number(linhas[0].total) > 0;
}