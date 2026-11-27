import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import InstituicaoCliente from "./InstituicaoCliente";

export const dynamic = "force-dynamic";

export default async function InstituicaoPage() {
	const acesso = await permissaoAtual("Administração");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") notFound();

	const instituicoes = await sql`
		select razao_social, nome_fantasia, sigla, cnpj, credenciamento, cep, logradouro, numero, complemento, bairro, cidade, uf, email, telefone, site
		from instituicao
		where 1=1
		and id = 1
	`;

	const configuracoes = await sql`
		select nota_aprovacao::float8 as aprovacao, nota_recuperacao::float8 as recuperacao, descarte_rascunho_dias as descarte
		from configuracao
		where 1=1
		and id = 1
	`;

	const pesos = await sql`
		select ordem, nome, peso::float8 as peso
		from configuracao_peso
		order by ordem
	`;

	const periodos = await sql`
		select
			codigo,
			to_char(data_inicio, 'DD/MM/YYYY') as inicio,
			to_char(data_fim, 'DD/MM/YYYY') as fim,
			case
				when atual then 'Atual'
				when data_fim < current_date then 'Encerrado'
				else 'Futuro'
			end as status
		from periodo_letivo
		order by codigo desc
	`;

	const i = instituicoes[0];
	const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v));

	return (
		<InstituicaoCliente
			podeEditar={acesso.nivel === "editar"}
			instituicao={{
				razaoSocial: texto(i?.razao_social),
				nomeFantasia: texto(i?.nome_fantasia),
				sigla: texto(i?.sigla),
				cnpj: texto(i?.cnpj),
				credenciamento: texto(i?.credenciamento),
				cep: texto(i?.cep),
				logradouro: texto(i?.logradouro),
				numero: texto(i?.numero),
				complemento: texto(i?.complemento),
				bairro: texto(i?.bairro),
				cidade: texto(i?.cidade),
				uf: texto(i?.uf),
				email: texto(i?.email),
				telefone: texto(i?.telefone),
				site: texto(i?.site),
			}}
			regras={{
				aprovacao: configuracoes.length > 0 ? Number(configuracoes[0].aprovacao) : 7,
				recuperacao: configuracoes.length > 0 ? Number(configuracoes[0].recuperacao) : 5,
				descarte: configuracoes.length > 0 ? Number(configuracoes[0].descarte) : 30,
			}}
			pesos={pesos.map((p) => ({ ordem: Number(p.ordem), nome: String(p.nome), peso: Number(p.peso) }))}
			periodos={periodos.map((p) => ({
				codigo: String(p.codigo),
				inicio: String(p.inicio),
				fim: String(p.fim),
				status: String(p.status),
			}))}
		/>
	);
}