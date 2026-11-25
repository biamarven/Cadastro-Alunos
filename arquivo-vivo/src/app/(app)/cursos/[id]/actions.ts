"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

type Resultado = { erro?: string };

async function autorizar() {
	try {
		return await exigirEdicao("Cursos e turmas", true);
	} catch {
		return null;
	}
}

export async function adicionarDisciplinaMatriz(
	cursoId: string,
	dados: { nome: string; periodo: number; cargaHoraria: number; tipo: string },
): Promise<Resultado> {
	const sessao = await autorizar();
	if (!sessao) return { erro: "Você não tem permissão para alterar a matriz." };
	if (!/^\d+$/.test(cursoId)) return { erro: "Curso inválido." };

	const nome = dados.nome.trim();
	if (nome.length < 3 || nome.length > 150) return { erro: "Informe o nome da disciplina (de 3 a 150 letras)." };
	if (!Number.isInteger(dados.cargaHoraria) || dados.cargaHoraria < 1 || dados.cargaHoraria > 2000) {
		return { erro: "Informe a carga horária em horas (de 1 a 2000)." };
	}
	if (!["obrigatoria", "optativa"].includes(dados.tipo)) return { erro: "Tipo inválido." };

	const cursos = await sql`
		select duracao_semestres
		from curso
		where 1=1
		and id = ${cursoId}::bigint
	`;
	if (cursos.length === 0) return { erro: "Curso não encontrado." };
	const duracao = Number(cursos[0].duracao_semestres);
	if (!Number.isInteger(dados.periodo) || dados.periodo < 1 || dados.periodo > duracao) {
		return { erro: `O período deve ficar entre 1 e ${duracao}.` };
	}

	let novo;
	try {
		novo = await sql`
			with disc as (
				insert into disciplina (nome)
				values (${nome}::text)
				on conflict (nome) do update set nome = excluded.nome
				returning id
			)
			insert into curso_disciplina (curso_id, disciplina_id, periodo, carga_horaria, tipo)
			select ${cursoId}::bigint, disc.id, ${dados.periodo}::smallint, ${dados.cargaHoraria}::smallint, ${dados.tipo}::text
			from disc
			returning id::text as id
		`;
	} catch (e) {
		const texto = e instanceof Error ? e.message : "";
		if (texto.includes("curso_disciplina_uq")) return { erro: "Essa disciplina já está na matriz deste curso." };
		return { erro: "Não foi possível adicionar a disciplina." };
	}

	await registrarAuditoria(sessao.usuarioId, "criar", "curso_disciplina", String(novo[0].id), {
		curso_id: cursoId,
		disciplina: nome,
		periodo: dados.periodo,
		carga_horaria: dados.cargaHoraria,
		tipo: dados.tipo,
	});

	revalidatePath(`/cursos/${cursoId}`);
	return {};
}

export async function removerDisciplinaMatriz(cursoDisciplinaId: string): Promise<Resultado> {
	const sessao = await autorizar();
	if (!sessao) return { erro: "Você não tem permissão para alterar a matriz." };
	if (!/^\d+$/.test(cursoDisciplinaId)) return { erro: "Disciplina inválida." };

	let removidas;
	try {
		removidas = await sql`
			delete from curso_disciplina
			where 1=1
			and id = ${cursoDisciplinaId}::bigint
			returning curso_id::text as curso_id
		`;
	} catch {
		return { erro: "Essa disciplina já foi ofertada em alguma turma e não pode ser removida." };
	}
	if (removidas.length === 0) return { erro: "Disciplina não encontrada na matriz." };

	const cursoId = String(removidas[0].curso_id);
	await registrarAuditoria(sessao.usuarioId, "remover", "curso_disciplina", cursoDisciplinaId, {}, { curso_id: cursoId });

	revalidatePath(`/cursos/${cursoId}`);
	return {};
}

export async function criarOferta(
	turmaId: string,
	cursoDisciplinaId: string,
	professorId: string | null,
): Promise<Resultado> {
	const sessao = await autorizar();
	if (!sessao) return { erro: "Você não tem permissão para criar ofertas." };
	if (!/^\d+$/.test(turmaId) || !/^\d+$/.test(cursoDisciplinaId)) return { erro: "Dados inválidos." };
	if (professorId !== null && !/^\d+$/.test(professorId)) return { erro: "Professor inválido." };

	const validos = await sql`
		select turma.curso_id::text as curso_id
		from turma
		join curso_disciplina on (
			curso_disciplina.curso_id = turma.curso_id
		)
		where 1=1
		and turma.id = ${turmaId}::bigint
		and curso_disciplina.id = ${cursoDisciplinaId}::bigint
	`;
	if (validos.length === 0) return { erro: "A disciplina não pertence ao curso desta turma." };
	const cursoId = String(validos[0].curso_id);

	if (professorId !== null) {
		const professores = await sql`
			select usuario.id
			from usuario
			join perfil on (
				perfil.id = usuario.perfil_id
			)
			where 1=1
			and usuario.id = ${professorId}::bigint
			and usuario.situacao = 'ativo'
			and perfil.nome = 'Professor'
		`;
		if (professores.length === 0) return { erro: "Escolha um professor ativo." };
	}

	const pesos = await sql`
		select count(*) as total
		from configuracao_peso
	`;
	if (Number(pesos[0].total) === 0) return { erro: "Configure os pesos das avaliações antes de ofertar." };

	let nova;
	try {
		nova = await sql`
			with nova_oferta as (
				insert into oferta_disciplina (turma_id, curso_disciplina_id, professor_id)
				values (${turmaId}::bigint, ${cursoDisciplinaId}::bigint, ${professorId}::bigint)
				returning id
			),
			novas_avaliacoes as (
				insert into avaliacao (oferta_disciplina_id, ordem, nome, peso)
				select nova_oferta.id, configuracao_peso.ordem, configuracao_peso.nome, configuracao_peso.peso
				from nova_oferta
				cross join configuracao_peso
				returning id
			),
			novos_alunos as (
				insert into matricula_disciplina (matricula_id, oferta_disciplina_id)
				select matricula_turma.matricula_id, nova_oferta.id
				from nova_oferta
				join matricula_turma on (
					matricula_turma.turma_id = ${turmaId}::bigint
				)
				join matricula on (
					matricula.id = matricula_turma.matricula_id and
					matricula.situacao <> 'inativa'
				)
				returning id
			)
			select id::text as id
			from nova_oferta
		`;
	} catch (e) {
		const texto = e instanceof Error ? e.message : "";
		if (texto.includes("oferta_disciplina_uq")) return { erro: "Essa disciplina já foi ofertada nesta turma." };
		return { erro: "Não foi possível criar a oferta." };
	}

	await registrarAuditoria(sessao.usuarioId, "criar", "oferta_disciplina", String(nova[0].id), {
		turma_id: turmaId,
		curso_disciplina_id: cursoDisciplinaId,
		professor_id: professorId,
	});

	revalidatePath(`/cursos/${cursoId}`);
	return {};
}

export async function definirProfessor(ofertaId: string, professorId: string | null): Promise<Resultado> {
	const sessao = await autorizar();
	if (!sessao) return { erro: "Você não tem permissão para alterar ofertas." };
	if (!/^\d+$/.test(ofertaId)) return { erro: "Oferta inválida." };
	if (professorId !== null && !/^\d+$/.test(professorId)) return { erro: "Professor inválido." };

	const atuais = await sql`
		select oferta_disciplina.professor_id::text as professor_id, turma.curso_id::text as curso_id
		from oferta_disciplina
		join turma on (
			turma.id = oferta_disciplina.turma_id
		)
		where 1=1
		and oferta_disciplina.id = ${ofertaId}::bigint
	`;
	if (atuais.length === 0) return { erro: "Oferta não encontrada." };
	const anterior = atuais[0].professor_id === null ? null : String(atuais[0].professor_id);
	const cursoId = String(atuais[0].curso_id);
	if (anterior === professorId) return {};

	if (professorId !== null) {
		const professores = await sql`
			select usuario.id
			from usuario
			join perfil on (
				perfil.id = usuario.perfil_id
			)
			where 1=1
			and usuario.id = ${professorId}::bigint
			and usuario.situacao = 'ativo'
			and perfil.nome = 'Professor'
		`;
		if (professores.length === 0) return { erro: "Escolha um professor ativo." };
	}

	await sql`
		update oferta_disciplina
		set professor_id = ${professorId}::bigint
		where 1=1
		and id = ${ofertaId}::bigint
	`;

	await registrarAuditoria(
		sessao.usuarioId,
		"editar",
		"oferta_disciplina",
		ofertaId,
		{ professor_id: professorId },
		{ professor_id: anterior },
	);

	revalidatePath(`/cursos/${cursoId}`);
	return {};
}