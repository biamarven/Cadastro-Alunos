"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao, permissaoAtual } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

type Alteracao = { matriculaDisciplinaId: string; avaliacaoId: string; valor: string };

const MOTIVOS: Record<string, string> = {
	erro_digitacao: "Erro de digitação",
	revisao_prova: "Revisão de prova",
	outro: "Outro",
};

export async function salvarNotas(
	ofertaId: string,
	alteracoes: Alteracao[],
	motivo: string,
	justificativa: string,
): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Notas");
	} catch {
		return { erro: "Você não tem permissão para lançar notas." };
	}
	const acesso = await permissaoAtual("Notas");
	const escopo = String(acesso.escopo);
	const usuarioId = String(sessao.usuarioId);

	if (!/^\d+$/.test(ofertaId)) return { erro: "Disciplina inválida." };
	if (!Array.isArray(alteracoes) || alteracoes.length === 0) return { erro: "Nenhuma alteração para salvar." };
	if (alteracoes.length > 500) return { erro: "Alterações demais de uma vez." };

	const permitidas = await sql`
		select oferta_disciplina.encerrada
		from oferta_disciplina
		join turma on (
			turma.id = oferta_disciplina.turma_id
		)
		join curso on (
			curso.id = turma.curso_id
		)
		where 1=1
		and oferta_disciplina.id = ${ofertaId}::bigint
		and (
			${escopo}::text = 'todos' or
			(${escopo}::text = 'turmas' and oferta_disciplina.professor_id = ${usuarioId}::bigint) or
			(${escopo}::text = 'curso' and curso.coordenador_id = ${usuarioId}::bigint)
		)
	`;
	if (permitidas.length === 0) return { erro: "Você não tem acesso a esta disciplina." };
	if (permitidas[0].encerrada) return { erro: "Esta disciplina está encerrada." };

	const linhas = await sql`
		select
			matricula_disciplina.id::text as md_id,
			avaliacao.id::text as av_id,
			nota.valor::float8 as valor
		from matricula_disciplina
		join matricula on (
			matricula.id = matricula_disciplina.matricula_id
		)
		join avaliacao on (
			avaliacao.oferta_disciplina_id = matricula_disciplina.oferta_disciplina_id
		)
		left join nota on (
			nota.matricula_disciplina_id = matricula_disciplina.id and
			nota.avaliacao_id = avaliacao.id
		)
		where 1=1
		and matricula_disciplina.oferta_disciplina_id = ${ofertaId}::bigint
		and matricula.situacao = 'ativa'
	`;
	const existentes = new Map<string, number | null>();
	for (const l of linhas) {
		existentes.set(`${l.md_id}:${l.av_id}`, l.valor === null ? null : Number(l.valor));
	}

	const novas: { md: string; av: string; valor: number }[] = [];
	const correcoes: { md: string; av: string; anterior: number; valor: number }[] = [];
	for (const a of alteracoes) {
		const chave = `${a.matriculaDisciplinaId}:${a.avaliacaoId}`;
		if (!existentes.has(chave)) return { erro: "Nota inválida para esta disciplina." };
		const texto = String(a.valor).trim().replace(",", ".");
		const numero = Number(texto);
		if (texto === "" || Number.isNaN(numero) || numero < 0 || numero > 10) {
			return { erro: "As notas devem ficar entre 0 e 10." };
		}
		const valor = Math.round(numero * 100) / 100;
		const anterior = existentes.get(chave) ?? null;
		if (anterior === null) {
			novas.push({ md: a.matriculaDisciplinaId, av: a.avaliacaoId, valor });
		} else if (anterior !== valor) {
			correcoes.push({ md: a.matriculaDisciplinaId, av: a.avaliacaoId, anterior, valor });
		}
	}
	if (novas.length === 0 && correcoes.length === 0) return {};

		let justificativaLimpa = justificativa.trim();
	if (correcoes.length > 0) {
		if (!Object.keys(MOTIVOS).includes(motivo)) return { erro: "Escolha o motivo da correção." };
		if (motivo === "outro" && justificativaLimpa.length < 5) {
			return { erro: "Descreva o motivo da correção (mínimo 5 caracteres)." };
		}
		if (justificativaLimpa === "") justificativaLimpa = MOTIVOS[motivo];
	}

	const ids = Array.from(new Set([...novas.map((n) => n.md), ...correcoes.map((c) => c.md)]));

	try {
		await sql.transaction([
			sql`
				insert into nota (matricula_disciplina_id, avaliacao_id, valor, lancada_por)
				select dados.md, dados.av, dados.valor, ${usuarioId}::bigint
				from unnest(
					${novas.map((n) => n.md)}::bigint[],
					${novas.map((n) => n.av)}::bigint[],
					${novas.map((n) => n.valor)}::numeric[]
				) as dados(md, av, valor)
			`,
			sql`
				insert into nota_alteracao (matricula_disciplina_id, avaliacao_id, valor_anterior, valor_novo, motivo, justificativa, alterado_por)
				select dados.md, dados.av, dados.anterior, dados.novo, ${motivo}::text, ${justificativaLimpa}::text, ${usuarioId}::bigint
				from unnest(
					${correcoes.map((c) => c.md)}::bigint[],
					${correcoes.map((c) => c.av)}::bigint[],
					${correcoes.map((c) => c.anterior)}::numeric[],
					${correcoes.map((c) => c.valor)}::numeric[]
				) as dados(md, av, anterior, novo)
			`,
			sql`
				update nota
				set valor = dados.novo, atualizada_em = now()
				from unnest(
					${correcoes.map((c) => c.md)}::bigint[],
					${correcoes.map((c) => c.av)}::bigint[],
					${correcoes.map((c) => c.valor)}::numeric[]
				) as dados(md, av, novo)
				where 1=1
				and nota.matricula_disciplina_id = dados.md
				and nota.avaliacao_id = dados.av
			`,
			sql`
				update matricula_disciplina
				set
					media = medias.media,
					situacao = case
						when medias.media is null then 'em_andamento'
						when medias.media >= (select nota_aprovacao from configuracao limit 1) then 'aprovado'
						when medias.media >= (select nota_recuperacao from configuracao limit 1) then 'recuperacao'
						else 'reprovado'
					end,
					atualizado_em = now()
				from (
					select
						matricula_disciplina.id as id,
						case
							when count(avaliacao.id) > 0 and count(nota.valor) = count(avaliacao.id)
							then round(sum(nota.valor * avaliacao.peso) / sum(avaliacao.peso), 1)
						end as media
					from matricula_disciplina
					join avaliacao on (
						avaliacao.oferta_disciplina_id = matricula_disciplina.oferta_disciplina_id
					)
					left join nota on (
						nota.matricula_disciplina_id = matricula_disciplina.id and
						nota.avaliacao_id = avaliacao.id
					)
					where 1=1
					and matricula_disciplina.id = any(${ids}::bigint[])
					group by matricula_disciplina.id
				) as medias
				where 1=1
				and matricula_disciplina.id = medias.id
			`,
		]);
	} catch {
		return { erro: "Não foi possível salvar as notas. Nada foi alterado." };
	}

	await registrarAuditoria(
		sessao.usuarioId,
		"lancar_notas",
		"oferta_disciplina",
		ofertaId,
		correcoes.length > 0
			? { lancadas: novas.length, corrigidas: correcoes.length, motivo }
			: { lancadas: novas.length, corrigidas: 0 },
	);

	revalidatePath("/notas");
	return {};
}