import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import HistoricoMatricula from "./HistoricoMatricula";

export const dynamic = "force-dynamic";

export default async function HistoricoPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const acesso = await permissaoAtual("Histórico acadêmico");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") notFound();

	const alunos = await sql`
		select nome_completo
		from aluno
		where 1=1
		and id = ${id}::bigint
	`;
	if (alunos.length === 0) notFound();

	const matriculas = await sql`
		select matricula.id::text as id, matricula.numero, matricula.situacao, curso.nome as curso
		from matricula
		join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		and matricula.aluno_id = ${id}::bigint
		order by matricula.numero
	`;

	const disciplinas = await sql`
		select
			matricula_disciplina.matricula_id::text as matricula_id,
			periodo_letivo.codigo as periodo,
			disciplina.nome as disciplina,
			curso_disciplina.carga_horaria,
			matricula_disciplina.media::float8 as media,
			matricula_disciplina.situacao
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
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		join curso_disciplina on (
			curso_disciplina.id = oferta_disciplina.curso_disciplina_id
		)
		join disciplina on (
			disciplina.id = curso_disciplina.disciplina_id
		)
		where 1=1
		and matricula.aluno_id = ${id}::bigint
		order by periodo_letivo.codigo, disciplina.nome
	`;

	const emissoes = await sql`
		select
			emissao_historico.matricula_id::text as matricula_id,
			emissao_historico.codigo_autenticacao,
			emissao_historico.tipo,
			to_char(emissao_historico.emitido_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as emitido_em,
			usuario.nome as emitido_por
		from emissao_historico
		join matricula on (
			matricula.id = emissao_historico.matricula_id
		)
		join usuario on (
			usuario.id = emissao_historico.emitido_por
		)
		where 1=1
		and matricula.aluno_id = ${id}::bigint
		order by emissao_historico.id desc
	`;

	const nomeAluno = String(alunos[0].nome_completo);

	return (
		<>
			<Titulo titulo="Histórico escolar" sub={nomeAluno} />
			<div className="space-y-6">
				{matriculas.length === 0 && <p className="text-sm text-suave">Este aluno não tem matrículas.</p>}
				{matriculas.map((m) => (
					<HistoricoMatricula
						key={String(m.id)}
						alunoNome={nomeAluno}
						matricula={{
							id: String(m.id),
							numero: String(m.numero),
							curso: String(m.curso),
							situacao: String(m.situacao),
						}}
						disciplinas={disciplinas
							.filter((d) => String(d.matricula_id) === String(m.id))
							.map((d) => ({
								periodo: String(d.periodo),
								nome: String(d.disciplina),
								carga: Number(d.carga_horaria),
								media: d.media === null ? null : Number(d.media),
								situacao: String(d.situacao),
							}))}
						emissoes={emissoes
							.filter((e) => String(e.matricula_id) === String(m.id))
							.map((e) => ({
								codigo: String(e.codigo_autenticacao),
								tipo: String(e.tipo),
								emitidoEm: String(e.emitido_em),
								emitidoPor: String(e.emitido_por),
							}))}
					/>
				))}
			</div>
		</>
	);
}