import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import { situacoesMatricula } from "@/lib/rotulos";
import AlunosCliente from "./AlunosCliente";

export const dynamic = "force-dynamic";

export default async function AlunosPage() {
	const cadastro = await permissaoAtual("Cadastro de alunos");

	const alunos = await sql`
		select
			aluno.id as aluno_id,
			matricula.id as matricula_id,
			aluno.nome_completo as nome,
			matricula.numero as matricula,
			curso.nome as curso,
			matricula.situacao,
			(
				select turma.codigo
				from matricula_turma
				join turma on (
					turma.id = matricula_turma.turma_id
				)
				join periodo_letivo on (
					periodo_letivo.id = matricula_turma.periodo_letivo_id
				)
				where 1=1
				and matricula_turma.matricula_id = matricula.id
				order by periodo_letivo.ano desc, periodo_letivo.semestre desc
				limit 1
			) as turma
		from aluno
		left join matricula on (
			matricula.aluno_id = aluno.id
		)
		left join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		order by aluno.nome_completo, matricula.numero
	`;

	const cursos = await sql`
		select nome
		from curso
		where 1=1
		order by nome
	`;

	return (
		<AlunosCliente
			podeCadastrar={cadastro.nivel === "editar"}
			cursos={cursos.map((c) => c.nome)}
			alunos={alunos.map((a) => ({
				chave: `${a.aluno_id}-${a.matricula_id ?? "0"}`,
				alunoId: String(a.aluno_id),
				nome: a.nome,
				matricula: a.matricula ?? "—",
				curso: a.curso ?? "—",
				turma: a.turma ?? "—",
				situacao: a.situacao ? situacoesMatricula[a.situacao] : "Sem matrícula",
			}))}
		/>
	);
}