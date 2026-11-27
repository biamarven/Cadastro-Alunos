"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";
import { modalidades, niveis, situacoesCurso, turnos } from "@/lib/rotulos";

type Resultado = { erro?: string };

export async function criarCurso(dados: {
	nome: string;
	codigo: string;
	nivel: string;
	modalidade: string;
	situacao: string;
	carga: number;
	duracao: number;
	vagas: number | null;
	turnos: string[];
}): Promise<Resultado> {
	const sessao = await exigirEdicao("Cursos e turmas", true);

	const nome = dados.nome.trim();
	const codigo = dados.codigo.trim().toUpperCase();
	const turnosValidos = dados.turnos.filter((t) => Object.keys(turnos).includes(t));

	if (!nome) {
		return { erro: "Informe o nome do curso." };
	}
	if (!/^[A-Z0-9-]{2,10}$/.test(codigo)) {
		return { erro: "O código deve ter de 2 a 10 caracteres (letras, números ou hífen)." };
	}
	if (!Object.keys(niveis).includes(dados.nivel)) {
		return { erro: "Nível inválido." };
	}
	if (!Object.keys(modalidades).includes(dados.modalidade)) {
		return { erro: "Modalidade inválida." };
	}
	if (!Object.keys(situacoesCurso).includes(dados.situacao)) {
		return { erro: "Situação inválida." };
	}
	if (!Number.isInteger(dados.carga) || dados.carga <= 0) {
		return { erro: "A carga horária deve ser um número inteiro maior que zero." };
	}
	if (!Number.isInteger(dados.duracao) || dados.duracao <= 0 || dados.duracao > 20) {
		return { erro: "A duração deve ser de 1 a 20 semestres." };
	}
	if (dados.vagas !== null && (!Number.isInteger(dados.vagas) || dados.vagas <= 0)) {
		return { erro: "As vagas por turma devem ser um número inteiro maior que zero." };
	}
	if (turnosValidos.length === 0) {
		return { erro: "Marque ao menos um turno." };
	}

	const repetidos = await sql`
		select id
		from curso
		where 1=1
		and (
			codigo = ${codigo}
			or lower(nome) = lower(${nome})
		)
	`;

	if (repetidos.length > 0) {
		return { erro: "Já existe um curso com esse código ou esse nome." };
	}

	const criados = await sql`
		with novo as (
			insert into curso (codigo, nome, nivel, modalidade, carga_horaria_total, duracao_semestres, vagas_por_turma, situacao)
			values (${codigo}, ${nome}, ${dados.nivel}, ${dados.modalidade}, ${dados.carga}, ${dados.duracao}, ${dados.vagas}, ${dados.situacao})
			returning id
		)
		insert into curso_turno (curso_id, turno)
		select novo.id, unnest(${turnosValidos}::text[])
		from novo
		returning curso_id
	`;

	await registrarAuditoria(sessao.usuarioId, "criar", "curso", String(criados[0].curso_id), {
		codigo,
		nome,
		nivel: dados.nivel,
		modalidade: dados.modalidade,
		situacao: dados.situacao,
		carga: dados.carga,
		duracao: dados.duracao,
		vagas: dados.vagas,
		turnos: turnosValidos,
	});

	revalidatePath("/cursos");
	return {};
}

export async function criarPeriodo(dados: {
	ano: number;
	semestre: number;
	inicio: string;
	fim: string;
	atual: boolean;
}): Promise<Resultado> {
	const sessao = await exigirEdicao("Cursos e turmas", true);

	if (!Number.isInteger(dados.ano) || dados.ano < 2000 || dados.ano > 2100) {
		return { erro: "Informe um ano entre 2000 e 2100." };
	}
	if (dados.semestre !== 1 && dados.semestre !== 2) {
		return { erro: "O semestre deve ser 1 ou 2." };
	}
	if (!dados.inicio || !dados.fim) {
		return { erro: "Informe as datas de início e fim." };
	}
	if (dados.fim <= dados.inicio) {
		return { erro: "A data de fim deve ser depois da data de início." };
	}

	const codigo = `${dados.ano}.${dados.semestre}`;

	const repetidos = await sql`
		select id
		from periodo_letivo
		where 1=1
		and ano = ${dados.ano}
		and semestre = ${dados.semestre}
	`;

	if (repetidos.length > 0) {
		return { erro: `O período ${codigo} já existe.` };
	}

	let novoId: string;

	if (dados.atual) {
		const resultado = await sql.transaction([
			sql`
				update periodo_letivo
				set atual = false
				where 1=1
				and atual
			`,
			sql`
				insert into periodo_letivo (codigo, ano, semestre, data_inicio, data_fim, atual)
				values (${codigo}, ${dados.ano}, ${dados.semestre}, ${dados.inicio}, ${dados.fim}, true)
				returning id
			`,
		]);
		novoId = String(resultado[1][0].id);
	} else {
		const criados = await sql`
			insert into periodo_letivo (codigo, ano, semestre, data_inicio, data_fim, atual)
			values (${codigo}, ${dados.ano}, ${dados.semestre}, ${dados.inicio}, ${dados.fim}, false)
			returning id
		`;
		novoId = String(criados[0].id);
	}

	await registrarAuditoria(sessao.usuarioId, "criar", "periodo_letivo", novoId, {
		codigo,
		inicio: dados.inicio,
		fim: dados.fim,
		atual: dados.atual,
	});

	revalidatePath("/cursos");
	return {};
}

export async function criarTurma(dados: {
	cursoId: string;
	periodoId: string;
	letra: string;
	periodoCurso: number;
	turno: string;
	vagas: number;
}): Promise<Resultado> {
	const sessao = await exigirEdicao("Cursos e turmas", true);

	const letra = dados.letra.trim().toUpperCase();

	if (!/^[A-Z]$/.test(letra)) {
		return { erro: "A letra da turma deve ser uma única letra (A a Z)." };
	}
	if (!Object.keys(turnos).includes(dados.turno)) {
		return { erro: "Turno inválido." };
	}
	if (!Number.isInteger(dados.vagas) || dados.vagas <= 0) {
		return { erro: "As vagas devem ser um número inteiro maior que zero." };
	}

	const cursos = await sql`
		select id, codigo, duracao_semestres
		from curso
		where 1=1
		and id = ${dados.cursoId}
	`;
	const periodos = await sql`
		select id, codigo
		from periodo_letivo
		where 1=1
		and id = ${dados.periodoId}
	`;

	if (cursos.length === 0) {
		return { erro: "Curso não encontrado." };
	}
	if (periodos.length === 0) {
		return { erro: "Período letivo não encontrado." };
	}

	const curso = cursos[0];
	const periodo = periodos[0];

	if (!Number.isInteger(dados.periodoCurso) || dados.periodoCurso < 1 || dados.periodoCurso > Number(curso.duracao_semestres)) {
		return { erro: `O período do curso deve ser de 1 a ${curso.duracao_semestres}.` };
	}

	const turnosDoCurso = await sql`
		select turno
		from curso_turno
		where 1=1
		and curso_id = ${dados.cursoId}
	`;

	if (turnosDoCurso.length > 0 && !turnosDoCurso.some((t) => t.turno === dados.turno)) {
		return { erro: "Esse curso não oferece o turno escolhido." };
	}

	const repetidas = await sql`
		select id
		from turma
		where 1=1
		and curso_id = ${dados.cursoId}
		and periodo_letivo_id = ${dados.periodoId}
		and letra = ${letra}
	`;

	if (repetidas.length > 0) {
		return { erro: "Já existe uma turma com essa letra para esse curso e período letivo." };
	}

	const codigo = `${curso.codigo}-${periodo.codigo}-${dados.periodoCurso}${letra}`;

	const criadas = await sql`
		insert into turma (codigo, curso_id, periodo_letivo_id, letra, periodo_curso, turno, vagas)
		values (${codigo}, ${dados.cursoId}, ${dados.periodoId}, ${letra}, ${dados.periodoCurso}, ${dados.turno}, ${dados.vagas})
		returning id
	`;

	await registrarAuditoria(sessao.usuarioId, "criar", "turma", String(criadas[0].id), {
		codigo,
		turno: dados.turno,
		vagas: dados.vagas,
	});

	revalidatePath("/cursos");
	return {};
}

export async function definirCoordenador(cursoId: string, usuarioId: string): Promise<Resultado> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cursos e turmas", true);
	} catch {
		return { erro: "Você não tem permissão para definir o coordenador." };
	}

	if (!/^\d+$/.test(cursoId)) {
		return { erro: "Curso inválido." };
	}
	if (usuarioId !== "" && !/^\d+$/.test(usuarioId)) {
		return { erro: "Usuário inválido." };
	}

	const cursos = await sql`
		select usuario.nome as coordenador
		from curso
		left join usuario on (
			usuario.id = curso.coordenador_id
		)
		where 1=1
		and curso.id = ${cursoId}::bigint
	`;
	if (cursos.length === 0) {
		return { erro: "Curso não encontrado." };
	}
	const anterior: string | null = cursos[0].coordenador === null ? null : String(cursos[0].coordenador);

	let novo: string | null = null;
	if (usuarioId !== "") {
		const usuarios = await sql`
			select nome
			from usuario
			where 1=1
			and id = ${usuarioId}::bigint
		`;
		if (usuarios.length === 0) {
			return { erro: "Usuário não encontrado." };
		}
		novo = String(usuarios[0].nome);
	}

	if (anterior === novo) {
		return {};
	}

	await sql`
		update curso
		set coordenador_id = ${usuarioId === "" ? null : usuarioId}::bigint
		where 1=1
		and id = ${cursoId}::bigint
	`;

	await registrarAuditoria(sessao.usuarioId, "editar", "curso", cursoId, { coordenador: novo }, { coordenador: anterior });

	revalidatePath("/cursos");
	return {};
}