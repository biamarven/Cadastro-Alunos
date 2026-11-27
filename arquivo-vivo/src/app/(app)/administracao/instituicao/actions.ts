"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirEdicao } from "@/lib/autorizacao";
import { registrarAuditoria } from "@/lib/auditoria";

type Resultado = { erro?: string };

type DadosInstituicao = {
	razaoSocial: string;
	nomeFantasia: string;
	sigla: string;
	cnpj: string;
	credenciamento: string;
	cep: string;
	logradouro: string;
	numero: string;
	complemento: string;
	bairro: string;
	cidade: string;
	uf: string;
	email: string;
	telefone: string;
	site: string;
};

function cnpjValido(texto: string): boolean {
	const d = texto.replace(/\D/g, "");
	if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
	const calcular = (base: string, pesos: number[]) => {
		const soma = base.split("").reduce((s, n, i) => s + Number(n) * pesos[i], 0);
		const resto = soma % 11;
		return resto < 2 ? 0 : 11 - resto;
	};
	const d1 = calcular(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
	const d2 = calcular(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
	return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export async function salvarInstituicao(dados: DadosInstituicao): Promise<Resultado> {
	let sessao;
	try {
		sessao = await exigirEdicao("Administração");
	} catch {
		return { erro: "Você não tem permissão para alterar a instituição." };
	}

	const novo: Record<string, string> = {
		razao_social: dados.razaoSocial.trim(),
		nome_fantasia: dados.nomeFantasia.trim(),
		sigla: dados.sigla.trim(),
		cnpj: dados.cnpj.replace(/\D/g, ""),
		credenciamento: dados.credenciamento.trim(),
		cep: dados.cep.replace(/\D/g, ""),
		logradouro: dados.logradouro.trim(),
		numero: dados.numero.trim(),
		complemento: dados.complemento.trim(),
		bairro: dados.bairro.trim(),
		cidade: dados.cidade.trim(),
		uf: dados.uf.trim().toUpperCase(),
		email: dados.email.trim().toLowerCase(),
		telefone: dados.telefone.trim(),
		site: dados.site.trim(),
	};

	if (novo.razao_social.length < 3 || novo.razao_social.length > 200) return { erro: "Informe a razão social." };
	if (novo.nome_fantasia.length < 2 || novo.nome_fantasia.length > 150) return { erro: "Informe o nome fantasia." };
	if (novo.sigla.length > 10) return { erro: "A sigla deve ter no máximo 10 caracteres." };
	if (!cnpjValido(novo.cnpj)) return { erro: "CNPJ inválido." };
	if (novo.cep.length !== 8) return { erro: "O CEP deve ter 8 dígitos." };
	if (!novo.logradouro || !novo.numero || !novo.bairro || !novo.cidade) {
		return { erro: "Preencha logradouro, número, bairro e cidade." };
	}
	if (!/^[A-Z]{2}$/.test(novo.uf)) return { erro: "UF inválida." };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo.email)) return { erro: "E-mail inválido." };
	if (!novo.telefone || novo.telefone.length > 20) return { erro: "Informe o telefone (até 20 caracteres)." };

	const atuais = await sql`
		select razao_social, nome_fantasia, sigla, cnpj, credenciamento, cep, logradouro, numero, complemento, bairro, cidade, uf, email, telefone, site
		from instituicao
		where 1=1
		and id = 1
	`;
	const existia = atuais.length > 0;

	const anteriores: Record<string, string | null> = {};
	const alterados: Record<string, string | null> = {};
	for (const [campo, valor] of Object.entries(novo)) {
		const antigo = existia && atuais[0][campo] != null ? String(atuais[0][campo]) : "";
		if (antigo !== valor) {
			anteriores[campo] = antigo === "" ? null : antigo;
			alterados[campo] = valor === "" ? null : valor;
		}
	}
	if (existia && Object.keys(alterados).length === 0) return {};

	try {
		await sql`
			insert into instituicao (
				id, razao_social, nome_fantasia, sigla, cnpj, credenciamento, cep, logradouro, numero,
				complemento, bairro, cidade, uf, email, telefone, site, atualizado_em, atualizado_por
			)
			values (
				1,
				${novo.razao_social},
				${novo.nome_fantasia},
				${novo.sigla === "" ? null : novo.sigla},
				${novo.cnpj},
				${novo.credenciamento === "" ? null : novo.credenciamento},
				${novo.cep},
				${novo.logradouro},
				${novo.numero},
				${novo.complemento === "" ? null : novo.complemento},
				${novo.bairro},
				${novo.cidade},
				${novo.uf},
				${novo.email},
				${novo.telefone},
				${novo.site === "" ? null : novo.site},
				now(),
				${String(sessao.usuarioId)}::bigint
			)
			on conflict (id) do update set
				razao_social = excluded.razao_social,
				nome_fantasia = excluded.nome_fantasia,
				sigla = excluded.sigla,
				cnpj = excluded.cnpj,
				credenciamento = excluded.credenciamento,
				cep = excluded.cep,
				logradouro = excluded.logradouro,
				numero = excluded.numero,
				complemento = excluded.complemento,
				bairro = excluded.bairro,
				cidade = excluded.cidade,
				uf = excluded.uf,
				email = excluded.email,
				telefone = excluded.telefone,
				site = excluded.site,
				atualizado_em = now(),
				atualizado_por = excluded.atualizado_por
		`;
	} catch {
		return { erro: "Não foi possível salvar a instituição." };
	}

	await registrarAuditoria(sessao.usuarioId, existia ? "editar" : "criar", "instituicao", 1, alterados, anteriores);

	revalidatePath("/administracao/instituicao");
	return {};
}

export async function salvarRegras(dados: {
	aprovacao: number;
	recuperacao: number;
	descarteDias: number;
	pesos: { ordem: number; peso: number }[];
}): Promise<Resultado> {
	let sessao;
	try {
		sessao = await exigirEdicao("Administração");
	} catch {
		return { erro: "Você não tem permissão para alterar as regras." };
	}

	const { aprovacao, recuperacao, descarteDias } = dados;
	if (!Number.isFinite(aprovacao) || aprovacao < 0 || aprovacao > 10) {
		return { erro: "A média para aprovar deve ficar entre 0 e 10." };
	}
	if (!Number.isFinite(recuperacao) || recuperacao < 0 || recuperacao > 10) {
		return { erro: "A média para recuperação deve ficar entre 0 e 10." };
	}
	if (recuperacao > aprovacao) return { erro: "A média de recuperação não pode ser maior que a de aprovação." };
	if (!Number.isInteger(descarteDias) || descarteDias < 1 || descarteDias > 365) {
		return { erro: "O descarte de rascunhos deve ser de 1 a 365 dias." };
	}
	if (!Array.isArray(dados.pesos) || dados.pesos.length === 0) return { erro: "Pesos inválidos." };

	const pesosAtuais = await sql`
		select ordem, nome, peso::float8 as peso
		from configuracao_peso
		order by ordem
	`;
	const nomePorOrdem = new Map<number, string>();
	const pesoAnterior = new Map<number, number>();
	for (const p of pesosAtuais) {
		nomePorOrdem.set(Number(p.ordem), String(p.nome));
		pesoAnterior.set(Number(p.ordem), Number(p.peso));
	}

	let soma = 0;
	for (const p of dados.pesos) {
		if (!nomePorOrdem.has(p.ordem)) return { erro: "Avaliação inválida." };
		if (!Number.isFinite(p.peso) || p.peso <= 0 || p.peso > 100) return { erro: "Cada peso deve ficar entre 0 e 100." };
		soma += p.peso;
	}
	if (dados.pesos.length !== pesosAtuais.length) return { erro: "Informe o peso de todas as avaliações." };
	if (Math.abs(soma - 100) > 0.001) return { erro: `Os pesos precisam somar 100 (agora: ${soma}).` };

	const configAtual = await sql`
		select nota_aprovacao::float8 as aprovacao, nota_recuperacao::float8 as recuperacao, descarte_rascunho_dias as descarte
		from configuracao
		where 1=1
		and id = 1
	`;

	const anteriores: Record<string, string | number | null> = {};
	const alterados: Record<string, string | number | null> = {};
	function comparar(campo: string, antigo: number | null, novo: number) {
		if (antigo !== novo) {
			anteriores[campo] = antigo;
			alterados[campo] = novo;
		}
	}
	comparar("nota_aprovacao", configAtual.length > 0 ? Number(configAtual[0].aprovacao) : null, aprovacao);
	comparar("nota_recuperacao", configAtual.length > 0 ? Number(configAtual[0].recuperacao) : null, recuperacao);
	comparar("descarte_rascunho_dias", configAtual.length > 0 ? Number(configAtual[0].descarte) : null, descarteDias);
	for (const p of dados.pesos) {
		comparar(`peso_${nomePorOrdem.get(p.ordem)}`, pesoAnterior.get(p.ordem) ?? null, p.peso);
	}
	if (Object.keys(alterados).length === 0) return {};

	try {
		await sql.transaction([
			sql`
				insert into configuracao (id, nota_aprovacao, nota_recuperacao, descarte_rascunho_dias, atualizado_em, atualizado_por)
				values (
					1,
					${aprovacao}::numeric,
					${recuperacao}::numeric,
					${descarteDias}::smallint,
					now(),
					${String(sessao.usuarioId)}::bigint
				)
				on conflict (id) do update set
					nota_aprovacao = excluded.nota_aprovacao,
					nota_recuperacao = excluded.nota_recuperacao,
					descarte_rascunho_dias = excluded.descarte_rascunho_dias,
					atualizado_em = now(),
					atualizado_por = excluded.atualizado_por
			`,
			sql`
				update configuracao_peso
				set peso = dados.peso
				from unnest(
					${dados.pesos.map((p) => p.ordem)}::smallint[],
					${dados.pesos.map((p) => p.peso)}::numeric[]
				) as dados(ordem, peso)
				where 1=1
				and configuracao_peso.ordem = dados.ordem
			`,
		]);
	} catch {
		return { erro: "Não foi possível salvar as regras." };
	}

	await registrarAuditoria(sessao.usuarioId, "editar", "configuracao", 1, alterados, anteriores);

	revalidatePath("/administracao/instituicao");
	return {};
}