import Link from "next/link";
import { notFound } from "next/navigation";
import { Cartao, Chip, Titulo, classeBotao, iniciais, tomSituacao } from "@/components/ui";
import { alunos } from "@/lib/mock";

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const aluno = alunos.find((a) => a.id === id);
	if (!aluno) notFound();

	const dados: [string, string][] = [
		["CPF", aluno.cpf],
		["Nascimento", new Date(aluno.nascimento).toLocaleDateString("pt-BR")],
		["E-mail", aluno.email],
		["Telefone", aluno.telefone],
		["Cidade", aluno.cidade],
	];

	return (
		<>
			<Titulo titulo={aluno.nome} sub="Perfil do aluno">
				<Link href={`/alunos/${aluno.id}/historico`} className={classeBotao("claro")}>Emitir histórico</Link>
				<Link href={`/alunos/${aluno.id}/editar`} className={classeBotao("primario")}>Editar</Link>
			</Titulo>

			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				<Cartao className="text-center">
					<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-lateral font-serif text-4xl font-bold text-white">
						{iniciais(aluno.nome)}
					</div>
					{/* Número da matrícula: ano.semestre-sequência (ex.: 2024.1-0412) */}
					<p className="mt-3 font-mono text-sm">{aluno.matricula}</p>
					<div className="mt-2"><Chip tom={tomSituacao(aluno.situacao)}>{aluno.situacao}</Chip></div>
				</Cartao>

				<div className="space-y-6">
					<Cartao titulo="Dados pessoais">
						<dl className="grid gap-3 text-sm md:grid-cols-2">
							{dados.map(([k, v]) => (
								<div key={k}><dt className="text-xs uppercase text-suave">{k}</dt><dd className="font-medium">{v}</dd></div>
							))}
						</dl>
					</Cartao>

					<Cartao titulo="Matrícula">
						<dl className="grid gap-3 text-sm md:grid-cols-3">
							<div><dt className="text-xs uppercase text-suave">Curso</dt><dd className="font-medium">{aluno.curso}</dd></div>
							<div><dt className="text-xs uppercase text-suave">Turma</dt><dd className="font-medium">{aluno.turma}</dd></div>
							<div><dt className="text-xs uppercase text-suave">Número</dt><dd className="font-mono">{aluno.matricula}</dd></div>
						</dl>
					</Cartao>

					{aluno.responsavel && (
						<Cartao titulo="Responsável legal">
							<dl className="grid gap-3 text-sm md:grid-cols-2">
								<div><dt className="text-xs uppercase text-suave">Nome</dt><dd className="font-medium">{aluno.responsavel.nome}</dd></div>
								<div><dt className="text-xs uppercase text-suave">Parentesco</dt><dd className="font-medium">{aluno.responsavel.parentesco}</dd></div>
								<div><dt className="text-xs uppercase text-suave">Telefone</dt><dd className="font-medium">{aluno.responsavel.telefone}</dd></div>
								<div><dt className="text-xs uppercase text-suave">CPF</dt><dd className="font-medium">{aluno.responsavel.cpf}</dd></div>
							</dl>
						</Cartao>
					)}
				</div>
			</div>
		</>
	);
}