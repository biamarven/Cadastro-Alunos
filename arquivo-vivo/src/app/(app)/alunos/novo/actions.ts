"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";
import { cpfValido, idadeEm } from "@/lib/formatos";
import { formasIngresso, parentescos } from "@/lib/rotulos";

type Resultado = { erro?: string; matricula?: string; alunoId?: string };

type Dados = {
	nome: string;
	nascimento: string;
	cpf: string;
	email: string;
	telefone: string;
	cep: string;
	rua: string;
	numero: string;
	bairro: string;
	cidade: string;
	uf: string;
	turmaId: string;
	formaIngresso: string;
	responsavel: {
		nome: string;
		parentesco: string;
		cpf: string;
		nascimento: string;
		telefone: string;
		email: string;
	} | null;
};

function ouNulo(valor: string) {
	const limpo = valor.trim();
	return limpo ? limpo : null;
}

function dataValida(valor: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
		return false;
	}
	const data = new Date(`${valor}T00:00:00Z`);
	return !Number.isNaN(data.getTime()) && data <= new Date() && Number(valor.slice(0, 4)) >= 1900;
}

function emailValido(valor: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export async function cadastrarAluno(dados: Dados): Promise<Resultado> {
	const sessao = await exigirEdicao("Cadastro de alunos");

	const nome = dados.nome.trim();
	const cpf = dados.cpf.replace(/\D/g, "");
	const email = dados.email.trim();
	const telefone = dados.telefone.trim();
	const cidade = dados.cidade.trim();
	const uf = dados.uf.trim().toUpperCase();
	const cep = dados.cep.replace(/\D/g, "");

	if (!nome) {
		return { erro: "Informe o nome completo do aluno." };
	}
	if (!dataValida(dados.nascimento)) {
		return { erro: "Informe uma data de nascimento válida." };
	}
	if (!cpfValido(cpf)) {
		return { erro: "O CPF do aluno é inválido." };
	}
	if (!emailValido(email)) {
		return { erro: "Informe um e-mail válido para o aluno." };
	}
	if (!telefone) {
		return { erro: "Informe o telefone do aluno." };
	}
	if (!cidade) {
		return { erro: "Informe a cidade." };
	}
	if (!/^[A-Z]{2}$/.test(uf)) {
		return { erro: "A UF deve ter duas letras (por exemplo, SC)." };
	}
	if (cep && cep.length !== 8) {
		return { erro: "O CEP deve ter 8 números." };
	}
	if (!Object.keys(formasIngresso).includes(dados.formaIngresso)) {
		return { erro: "Escolha a forma de ingresso." };
	}

	const menor = idadeEm(dados.nascimento) < 18;
	const responsavel = dados.responsavel;

	if (menor && !responsavel) {
		return { erro: "Aluno menor de 18 anos: informe o responsável legal." };
	}

	let respCpf = "";
	if (menor && responsavel) {
		respCpf = responsavel.cpf.replace(/\D/g, "");

		if (!responsavel.nome.trim()) {
			return { erro: "Informe o nome do responsável." };
		}
		if (!Object.keys(parentescos).includes(responsavel.parentesco)) {
			return { erro: "Escolha o parentesco do responsável." };
		}
		if (!cpfValido(respCpf)) {
			return { erro: "O CPF do responsável é inválido." };
		}
		if (respCpf === cpf) {
			return { erro: "O responsável não pode ter o mesmo CPF do aluno." };
		}
		if (!dataValida(responsavel.nascimento) || idadeEm(responsavel.nascimento) < 18) {
			return { erro: "O responsável deve ter data de nascimento válida e ser maior de 18 anos." };
		}
		if (!responsavel.telefone.trim()) {
			return { erro: "Informe o telefone do responsável." };
		}
		if (!emailValido(responsavel.email.trim())) {
			return { erro: "Informe um e-mail válido para o responsável." };
		}
	}

	const existentes = await sql`
		select id
		from aluno
		where 1=1
		and cpf = ${cpf}
	`;

	if (existentes.length > 0) {
		return { erro: "Já existe um aluno cadastrado com esse CPF." };
	}

	const turmas = await sql`
		select
			turma.id,
			turma.curso_id,
			turma.periodo_letivo_id,
			turma.turno,
			turma.vagas,
			turma.situacao,
			periodo_letivo.codigo as periodo,
			(
				select count(*)
				from matricula_turma
				where 1=1
				and matricula_turma.turma_id = turma.id
			) as matriculados
		from turma
		join periodo_letivo on (
			periodo_letivo.id = turma.periodo_letivo_id
		)
		where 1=1
		and turma.id = ${dados.turmaId}
	`;

	if (turmas.length === 0) {
		return { erro: "Turma não encontrada." };
	}

	const turma = turmas[0];

	if (turma.situacao !== "aberta") {
		return { erro: "Essa turma está encerrada." };
	}
	if (Number(turma.matriculados) >= Number(turma.vagas)) {
		return { erro: "Essa turma não tem mais vagas." };
	}

	const temResponsavel = menor && responsavel !== null;

	for (let tentativa = 0; tentativa < 3; tentativa++) {
		try {
			const criados = await sql`
				with novo_aluno as (
					insert into aluno (nome_completo, cpf, data_nascimento, email, telefone, cep, logradouro, numero, bairro, cidade, uf, criado_por)
					values (
						${nome},
						${cpf},
						${dados.nascimento}::date,
						${email},
						${telefone},
						${ouNulo(cep)},
						${ouNulo(dados.rua)},
						${ouNulo(dados.numero)},
						${ouNulo(dados.bairro)},
						${cidade},
						${uf},
						${sessao.usuarioId}::bigint
					)
					returning id
				),
				novo_responsavel as (
					insert into responsavel (nome_completo, cpf, data_nascimento, telefone, email)
					select
						${responsavel?.nome.trim() ?? null}::text,
						${respCpf || null}::text,
						${responsavel?.nascimento || null}::date,
						${responsavel?.telefone.trim() ?? null}::text,
						${responsavel?.email.trim() ?? null}::text
					where ${temResponsavel}::boolean
					on conflict (cpf) do update set
						nome_completo = excluded.nome_completo,
						telefone = excluded.telefone,
						email = excluded.email,
						atualizado_em = now()
					returning id
				),
				vinculo as (
					insert into aluno_responsavel (aluno_id, responsavel_id, parentesco)
					select novo_aluno.id, novo_responsavel.id, ${responsavel?.parentesco ?? null}::text
					from novo_aluno
					cross join novo_responsavel
					returning aluno_id
				),
				nova_matricula as (
					insert into matricula (numero, aluno_id, curso_id, periodo_ingresso_id, sequencial, forma_ingresso, turno, criado_por)
					select
						${turma.periodo}::text || '-' || lpad(proximo.sequencial::text, 4, '0'),
						novo_aluno.id,
						${turma.curso_id}::bigint,
						${turma.periodo_letivo_id}::bigint,
						proximo.sequencial,
						${dados.formaIngresso}::text,
						${turma.turno}::text,
						${sessao.usuarioId}::bigint
					from novo_aluno
					cross join (
						select coalesce(max(matricula.sequencial), 0) + 1 as sequencial
						from matricula
						where 1=1
						and matricula.periodo_ingresso_id = ${turma.periodo_letivo_id}::bigint
					) as proximo
					returning id, numero
				),
				nova_turma as (
					insert into matricula_turma (matricula_id, periodo_letivo_id, turma_id)
					select nova_matricula.id, ${turma.periodo_letivo_id}::bigint, ${turma.id}::bigint
					from nova_matricula
					returning matricula_id
				)
				select
					novo_aluno.id as aluno_id,
					nova_matricula.numero
				from novo_aluno
				cross join nova_matricula
			`;

			const alunoId = String(criados[0].aluno_id);
			const numero = String(criados[0].numero);

			await registrarAuditoria(sessao.usuarioId, "criar", "aluno", alunoId, {
				nome,
				matricula: numero,
				turmaId: dados.turmaId,
				comResponsavel: temResponsavel,
			});

			revalidatePath("/alunos");
			revalidatePath("/cursos");

			return { matricula: numero, alunoId };
		} catch (erro) {
			const mensagem = erro instanceof Error ? erro.message : "";

			if (mensagem.includes("matricula_periodo_sequencial_uq")) {
				continue;
			}
			if (mensagem.includes("aluno_cpf_key")) {
				return { erro: "Já existe um aluno cadastrado com esse CPF." };
			}
			throw erro;
		}
	}

	return { erro: "Não foi possível gerar o número da matrícula. Tente novamente." };
}