import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui";
import { sql } from "@/lib/db";
import { formatarCpf, idadeEm } from "@/lib/formatos";
import FormEditar from "./FormEditar";
import SituacaoMatricula from "./SituacaoMatricula";
import ResponsaveisEdicao from "./ResponsaveisEdicao";

export const dynamic = "force-dynamic";

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const alunos = await sql`
		select
			id::text as id, nome_completo, cpf, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf,
			to_char(data_nascimento, 'YYYY-MM-DD') as nascimento
		from aluno
		where 1=1
		and id = ${id}::bigint
	`;
	if (alunos.length === 0) notFound();
	const a = alunos[0];

	const matriculas = await sql`
		select matricula.id::text as id, matricula.numero, matricula.situacao, curso.nome as curso
		from matricula join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		and matricula.aluno_id = ${id}::bigint
		order by matricula.numero
	`;

	const responsaveis = await sql`
		select
			responsavel.id::text as id,
			responsavel.nome_completo,
			responsavel.cpf,
			to_char(responsavel.data_nascimento, 'YYYY-MM-DD') as nascimento,
			responsavel.telefone,
			responsavel.email,
			aluno_responsavel.parentesco,
			aluno_responsavel.responsavel_financeiro
		from aluno_responsavel
		join responsavel on (
			responsavel.id = aluno_responsavel.responsavel_id
		)
		where 1=1
		and aluno_responsavel.aluno_id = ${id}::bigint
		order by responsavel.nome_completo
	`;

	const aluno = {
		id: String(a.id),
		nome: String(a.nome_completo),
		cpf: formatarCpf(String(a.cpf)),
		email: String(a.email ?? ""),
		telefone: String(a.telefone ?? ""),
		cep: String(a.cep ?? ""),
		logradouro: String(a.logradouro ?? ""),
		numero: String(a.numero ?? ""),
		complemento: String(a.complemento ?? ""),
		bairro: String(a.bairro ?? ""),
		cidade: String(a.cidade ?? ""),
		uf: String(a.uf ?? ""),
	};

	const listaMatriculas = matriculas.map((m) => ({
		id: String(m.id),
		numero: String(m.numero),
		curso: String(m.curso),
		situacao: String(m.situacao),
	}));

	const listaResponsaveis = responsaveis.map((r) => ({
		id: String(r.id),
		nome: String(r.nome_completo),
		cpf: formatarCpf(String(r.cpf)),
		nascimento: String(r.nascimento),
		telefone: String(r.telefone ?? ""),
		email: String(r.email ?? ""),
		parentesco: String(r.parentesco),
		financeiro: Boolean(r.responsavel_financeiro),
	}));

	const menor = idadeEm(String(a.nascimento)) < 18;

	return (
		<>
			<Titulo titulo={`Editar: ${aluno.nome}`} sub="Matrícula, curso e CPF não são editados aqui." />
			<FormEditar
				aluno={aluno}
				matriculas={listaMatriculas.map((m) => ({ numero: m.numero, curso: m.curso }))}
			/>
			<ResponsaveisEdicao alunoId={aluno.id} menor={menor} responsaveis={listaResponsaveis} />
			<SituacaoMatricula matriculas={listaMatriculas} />
		</>
	);
}