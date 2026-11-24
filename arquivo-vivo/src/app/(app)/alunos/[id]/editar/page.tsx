import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui";
import { sql } from "@/lib/db";
import { formatarCpf } from "@/lib/formatos";
import FormEditar from "./FormEditar";

export const dynamic = "force-dynamic";

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const alunos = await sql`
		select id::text as id, nome_completo, cpf, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf
		from aluno
		where 1=1
		and id = ${id}::bigint
	`;
	if (alunos.length === 0) notFound();
	const a = alunos[0];

	const matriculas = await sql`
		select matricula.numero, curso.nome as curso
		from matricula join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		and matricula.aluno_id = ${id}::bigint
		order by matricula.numero
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

	return (
		<>
			<Titulo titulo={`Editar: ${aluno.nome}`} sub="Matrícula, curso e CPF não são editados aqui." />
			<FormEditar
				aluno={aluno}
				matriculas={matriculas.map((m) => ({ numero: String(m.numero), curso: String(m.curso) }))}
			/>
		</>
	);
}