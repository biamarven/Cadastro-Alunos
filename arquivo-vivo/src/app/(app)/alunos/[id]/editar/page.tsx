import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui";
import { alunos } from "@/lib/mock";
import FormEditar from "./FormEditar";

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const aluno = alunos.find((a) => a.id === id);
	if (!aluno) notFound();

	return (
		<>
			<Titulo titulo={`Editar: ${aluno.nome}`} sub="Matrícula e curso não são editados aqui." />
			<FormEditar aluno={aluno} />
		</>
	);
}