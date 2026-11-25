"use server";

import { idadeEm } from "@/lib/formatos";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

type DadosEdicao = {
	nome: string; email: string; telefone: string; cep: string; logradouro: string;
	numero: string; complemento: string; bairro: string; cidade: string; uf: string;
};

export async function atualizarAluno(id: string, dados: DadosEdicao): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para editar alunos." };
	}

	if (!/^\d+$/.test(id)) return { erro: "Aluno inválido." };

	const novo = {
		nome_completo: dados.nome.trim(),
		email: dados.email.trim().toLowerCase(),
		telefone: dados.telefone.trim(),
		cep: dados.cep.replace(/\D/g, ""),
		logradouro: dados.logradouro.trim(),
		numero: dados.numero.trim(),
		complemento: dados.complemento.trim(),
		bairro: dados.bairro.trim(),
		cidade: dados.cidade.trim(),
		uf: dados.uf.trim().toUpperCase(),
	};

	if (novo.nome_completo.length < 3) return { erro: "Informe o nome completo." };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo.email)) return { erro: "E-mail inválido." };
	if (!novo.telefone) return { erro: "Informe o telefone." };
	if (novo.cep.length !== 8) return { erro: "O CEP deve ter 8 dígitos." };
	if (!novo.logradouro || !novo.numero || !novo.bairro || !novo.cidade) {
		return { erro: "Preencha logradouro, número, bairro e cidade." };
	}
	if (!/^[A-Z]{2}$/.test(novo.uf)) return { erro: "UF inválida." };

	const atuais = await sql`
		select nome_completo, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf
		from aluno
		where 1=1
		and id = ${id}::bigint
	`;
	if (atuais.length === 0) return { erro: "Aluno não encontrado." };
	const antigo = atuais[0];

	const anteriores: Record<string, string | null> = {};
	const alterados: Record<string, string | null> = {};
	for (const [campo, valor] of Object.entries(novo)) {
		const valorAntigo = antigo[campo] == null ? "" : String(antigo[campo]);
		if (valorAntigo !== valor) {
			anteriores[campo] = valorAntigo === "" ? null : valorAntigo;
			alterados[campo] = valor === "" ? null : valor;
		}
	}

	if (Object.keys(alterados).length === 0) return {};

	try {
		await sql`
			update aluno
			set
				nome_completo = ${novo.nome_completo},
				email = ${novo.email},
				telefone = ${novo.telefone},
				cep = ${novo.cep},
				logradouro = ${novo.logradouro},
				numero = ${novo.numero},
				complemento = ${novo.complemento === "" ? null : novo.complemento},
				bairro = ${novo.bairro},
				cidade = ${novo.cidade},
				uf = ${novo.uf}
			where 1=1
			and id = ${id}::bigint
		`;
	} catch {
		return { erro: "Não foi possível salvar. Verifique os dados e tente de novo." };
	}

	await registrarAuditoria(sessao.usuarioId, "editar", "aluno", id, alterados, anteriores);

	revalidatePath("/alunos");
	revalidatePath(`/alunos/${id}`);
	return {};
}

const SITUACOES_VALIDAS = ["ativa", "trancada", "inativa"];

const MOTIVOS_POR_SITUACAO: Record<string, string[]> = {
	ativa: ["reabertura", "outro"],
	trancada: ["trancamento", "outro"],
	inativa: ["desistencia", "transferencia", "conclusao", "outro"],
};

export async function alterarSituacaoMatricula(
	matriculaId: string,
	nova: string,
	motivo: string,
	dataEfeito: string,
	observacao: string,
): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para alterar a situação." };
	}

	if (!/^\d+$/.test(matriculaId)) return { erro: "Matrícula inválida." };
	if (!SITUACOES_VALIDAS.includes(nova)) return { erro: "Situação inválida." };
	if (!(MOTIVOS_POR_SITUACAO[nova] ?? []).includes(motivo)) {
		return { erro: "Motivo incompatível com a nova situação." };
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEfeito) || Number.isNaN(Date.parse(dataEfeito))) {
		return { erro: "Informe uma data de efeito válida." };
	}
	const obs = observacao.trim();
	if (motivo === "outro" && obs === "") return { erro: "Descreva o motivo na observação." };

	const atuais = await sql`
		select situacao, aluno_id::text as aluno_id
		from matricula
		where 1=1
		and id = ${matriculaId}::bigint
	`;
	if (atuais.length === 0) return { erro: "Matrícula não encontrada." };
	const atual = String(atuais[0].situacao);
	const alunoId = String(atuais[0].aluno_id);
	if (atual === nova) return { erro: "A matrícula já está nessa situação." };

	let registro;
	try {
		registro = await sql`
			with atualizada as (
				update matricula
				set situacao = ${nova}::text, atualizado_em = now()
				where 1=1
				and id = ${matriculaId}::bigint
				and situacao = ${atual}::text
				returning id
			)
			insert into matricula_situacao_historico (matricula_id, situacao_anterior, situacao_nova, motivo, data_efeito, observacao, alterado_por)
			select
				atualizada.id,
				${atual}::text,
				${nova}::text,
				${motivo}::text,
				${dataEfeito}::date,
				${obs === "" ? null : obs}::text,
				${String(sessao.usuarioId)}::bigint
			from atualizada
			returning id
		`;
	} catch (e) {
		const texto = e instanceof Error ? e.message : "";
		if (texto.includes("matricula_aluno_curso_ativa_uq")) {
			return { erro: "O aluno já tem outra matrícula ativa ou trancada neste curso." };
		}
		return { erro: "Não foi possível alterar a situação." };
	}
	if (registro.length === 0) {
		return { erro: "A situação mudou enquanto você editava. Recarregue a página." };
	}

	await registrarAuditoria(
		sessao.usuarioId,
		"alterar_situacao",
		"matricula",
		matriculaId,
		{ situacao: nova, motivo },
		{ situacao: atual },
	);

	revalidatePath("/alunos");
	revalidatePath(`/alunos/${alunoId}`);
	revalidatePath("/cursos");
	return {};
}


const PARENTESCOS_VALIDOS = ["mae", "pai", "avo", "tio", "irmao", "tutor_legal", "outro"];

type DadosResponsavel = {
	nome: string;
	nascimento: string;
	telefone: string;
	email: string;
	parentesco: string;
	financeiro: boolean;
};

export async function salvarResponsavel(
	alunoId: string,
	responsavelId: string,
	dados: DadosResponsavel,
): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para editar responsáveis." };
	}

	if (!/^\d+$/.test(alunoId) || !/^\d+$/.test(responsavelId)) return { erro: "Dados inválidos." };

	const nome = dados.nome.trim();
	const email = dados.email.trim().toLowerCase();
	const telefone = dados.telefone.trim();
	if (nome.length < 3) return { erro: "Informe o nome completo do responsável." };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "E-mail do responsável inválido." };
	if (!telefone) return { erro: "Informe o telefone do responsável." };
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.nascimento) || Number.isNaN(Date.parse(dados.nascimento))) {
		return { erro: "Data de nascimento do responsável inválida." };
	}
	if (idadeEm(dados.nascimento) < 18) return { erro: "O responsável precisa ter 18 anos ou mais." };
	if (!PARENTESCOS_VALIDOS.includes(dados.parentesco)) return { erro: "Parentesco inválido." };

	const atuais = await sql`
		select
			responsavel.nome_completo,
			to_char(responsavel.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
			responsavel.telefone,
			responsavel.email,
			aluno_responsavel.parentesco,
			aluno_responsavel.responsavel_financeiro
		from aluno_responsavel
		join responsavel on (
			responsavel.id = aluno_responsavel.responsavel_id
		)
		where 1=1
		and aluno_responsavel.aluno_id = ${alunoId}::bigint
		and aluno_responsavel.responsavel_id = ${responsavelId}::bigint
	`;
	if (atuais.length === 0) return { erro: "Responsável não encontrado neste aluno." };
	const antigo = atuais[0];

	const novosResp: Record<string, string> = {
		nome_completo: nome,
		data_nascimento: dados.nascimento,
		telefone,
		email,
	};
	const antesResp: Record<string, string> = {};
	const depoisResp: Record<string, string> = {};
	for (const [campo, valor] of Object.entries(novosResp)) {
		const valorAntigo = antigo[campo] == null ? "" : String(antigo[campo]);
		if (valorAntigo !== valor) {
			antesResp[campo] = valorAntigo;
			depoisResp[campo] = valor;
		}
	}

	const financeiroAntigo = Boolean(antigo.responsavel_financeiro);
	const vinculoMudou = String(antigo.parentesco) !== dados.parentesco || financeiroAntigo !== dados.financeiro;
	const respMudou = Object.keys(depoisResp).length > 0;
	if (!respMudou && !vinculoMudou) return {};

	try {
		await sql`
			with atualizado as (
				update responsavel
				set
					nome_completo = ${nome},
					data_nascimento = ${dados.nascimento}::date,
					telefone = ${telefone},
					email = ${email},
					atualizado_em = now()
				where 1=1
				and id = ${responsavelId}::bigint
				returning id
			)
			update aluno_responsavel
			set
				parentesco = ${dados.parentesco}::text,
				responsavel_financeiro = ${dados.financeiro}::boolean
			where 1=1
			and aluno_id = ${alunoId}::bigint
			and responsavel_id = ${responsavelId}::bigint
		`;
	} catch {
		return { erro: "Não foi possível salvar o responsável." };
	}

	if (respMudou) {
		await registrarAuditoria(sessao.usuarioId, "editar", "responsavel", responsavelId, depoisResp, antesResp);
	}
	if (vinculoMudou) {
		await registrarAuditoria(
			sessao.usuarioId,
			"editar",
			"aluno_responsavel",
			alunoId,
			{ responsavel_id: responsavelId, parentesco: dados.parentesco, responsavel_financeiro: dados.financeiro },
			{ responsavel_id: responsavelId, parentesco: String(antigo.parentesco), responsavel_financeiro: financeiroAntigo },
		);
	}

	revalidatePath(`/alunos/${alunoId}`);
	return {};
}

export async function removerResponsavel(alunoId: string, responsavelId: string): Promise<{ erro?: string }> {
	let sessao;
	try {
		sessao = await exigirEdicao("Cadastro de alunos");
	} catch {
		return { erro: "Você não tem permissão para editar responsáveis." };
	}

	if (!/^\d+$/.test(alunoId) || !/^\d+$/.test(responsavelId)) return { erro: "Dados inválidos." };

	const alunos = await sql`
		select
			to_char(aluno.data_nascimento, 'YYYY-MM-DD') as nascimento,
			(
				select count(*)
				from aluno_responsavel
				where 1=1
				and aluno_responsavel.aluno_id = aluno.id
			) as total
		from aluno
		where 1=1
		and aluno.id = ${alunoId}::bigint
	`;
	if (alunos.length === 0) return { erro: "Aluno não encontrado." };

	const menor = idadeEm(String(alunos[0].nascimento)) < 18;
	if (menor && Number(alunos[0].total) <= 1) {
		return { erro: "Aluno menor de 18 anos precisa ter ao menos um responsável." };
	}

	const removidos = await sql`
		delete from aluno_responsavel
		where 1=1
		and aluno_id = ${alunoId}::bigint
		and responsavel_id = ${responsavelId}::bigint
		returning responsavel_id
	`;
	if (removidos.length === 0) return { erro: "Vínculo não encontrado." };

	await registrarAuditoria(
		sessao.usuarioId,
		"remover_vinculo",
		"aluno_responsavel",
		alunoId,
		{},
		{ responsavel_id: responsavelId },
	);

	revalidatePath(`/alunos/${alunoId}`);
	return {};
}