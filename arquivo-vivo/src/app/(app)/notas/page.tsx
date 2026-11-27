import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import NotasCliente, { type Selecionada } from "./NotasCliente";

export const dynamic = "force-dynamic";

export default async function NotasPage({ searchParams }: { searchParams: Promise<{ oferta?: string }> }) {
	const { oferta } = await searchParams;

	const acesso = await permissaoAtual("Notas");
	if (!acesso.sessao || (acesso.nivel !== "ver" && acesso.nivel !== "editar")) notFound();
	const usuarioId = String(acesso.sessao.usuarioId);
	const escopo = String(acesso.escopo);
	const podeEditar = acesso.nivel === "editar";

	const ofertas = await sql`
		select
			oferta_disciplina.id::text as id,
			periodo_letivo.codigo as periodo,
			curso.nome as curso,
			turma.codigo as turma,
			disciplina.nome as disciplina
		from oferta_disciplina
		join turma on (
			turma.id = oferta_disciplina.turma_id
		)
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		join curso on (
			curso.id = turma.curso_id
		)
		join curso_disciplina on (
			curso_disciplina.id = oferta_disciplina.curso_disciplina_id
		)
		join disciplina on (
			disciplina.id = curso_disciplina.disciplina_id
		)
		where 1=1
		and (
			${escopo}::text = 'todos' or
			(${escopo}::text = 'turmas' and oferta_disciplina.professor_id = ${usuarioId}::bigint) or
			(${escopo}::text = 'curso' and curso.coordenador_id = ${usuarioId}::bigint)
		)
		order by periodo_letivo.codigo desc, curso.nome, turma.codigo, disciplina.nome
	`;

	const config = await sql`
		select nota_aprovacao::float8 as aprovacao, nota_recuperacao::float8 as recuperacao
		from configuracao
		limit 1
	`;
	const aprovacao = config.length > 0 ? Number(config[0].aprovacao) : 7;
	const recuperacao = config.length > 0 ? Number(config[0].recuperacao) : 5;

	let selecionada: Selecionada | null = null;
	if (oferta && /^\d+$/.test(oferta) && ofertas.some((o) => String(o.id) === oferta)) {
		await sql`
			insert into matricula_disciplina (matricula_id, oferta_disciplina_id)
			select matricula_turma.matricula_id, ${oferta}::bigint
			from matricula_turma
			join matricula on (
				matricula.id = matricula_turma.matricula_id and
				matricula.situacao <> 'inativa'
			)
			where 1=1
			and matricula_turma.turma_id = (
				select oferta_disciplina.turma_id
				from oferta_disciplina
				where 1=1
				and oferta_disciplina.id = ${oferta}::bigint
			)
			on conflict (matricula_id, oferta_disciplina_id) do nothing
		`;

		const dadosOferta = await sql`
			select encerrada
			from oferta_disciplina
			where 1=1
			and id = ${oferta}::bigint
		`;

		const avaliacoes = await sql`
			select id::text as id, nome, peso::float8 as peso
			from avaliacao
			where 1=1
			and oferta_disciplina_id = ${oferta}::bigint
			order by ordem
		`;

		const alunos = await sql`
			select
				matricula_disciplina.id::text as id,
				aluno.nome_completo,
				matricula.numero,
				matricula.situacao as situacao_matricula,
				matricula_disciplina.media::float8 as media,
				matricula_disciplina.situacao
			from matricula_disciplina
			join matricula on (
				matricula.id = matricula_disciplina.matricula_id
			)
			join aluno on (
				aluno.id = matricula.aluno_id
			)
			where 1=1
			and matricula_disciplina.oferta_disciplina_id = ${oferta}::bigint
			order by aluno.nome_completo
		`;

		const notas = await sql`
			select
				nota.matricula_disciplina_id::text as md_id,
				nota.avaliacao_id::text as av_id,
				nota.valor::float8 as valor
			from nota
			join matricula_disciplina on (
				matricula_disciplina.id = nota.matricula_disciplina_id
			)
			where 1=1
			and matricula_disciplina.oferta_disciplina_id = ${oferta}::bigint
		`;

		const notasPorAluno = new Map<string, Record<string, number | null>>();
		for (const n of notas) {
			const atual = notasPorAluno.get(String(n.md_id)) ?? {};
			atual[String(n.av_id)] = Number(n.valor);
			notasPorAluno.set(String(n.md_id), atual);
		}

		const linhas = alunos.map((a) => ({
			mdId: String(a.id),
			nome: String(a.nome_completo),
			matricula: String(a.numero),
			situacaoMatricula: String(a.situacao_matricula),
			notas: notasPorAluno.get(String(a.id)) ?? {},
			media: a.media === null ? null : Number(a.media),
			situacao: String(a.situacao),
		}));

		selecionada = {
			id: oferta,
			encerrada: Boolean(dadosOferta[0]?.encerrada),
			avaliacoes: avaliacoes.map((a) => ({ id: String(a.id), nome: String(a.nome), peso: Number(a.peso) })),
			linhas,
			chave: linhas.map((l) => `${l.mdId}=${JSON.stringify(l.notas)}/${l.media}`).join(";"),
		};
	}

	return (
		<NotasCliente
			ofertas={ofertas.map((o) => ({
				id: String(o.id),
				periodo: String(o.periodo),
				curso: String(o.curso),
				turma: String(o.turma),
				disciplina: String(o.disciplina),
			}))}
			selecionada={selecionada}
			podeEditar={podeEditar}
			aprovacao={aprovacao}
			recuperacao={recuperacao}
		/>
	);
}