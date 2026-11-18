"use client";

import Link from "next/link";
import { useState } from "react";
import { Campo, Cartao, Chip, Titulo, classeBotao, tomSituacao } from "@/components/ui";
import { alunos, cursos } from "@/lib/mock";

export default function AlunosPage() {
	const [busca, setBusca] = useState("");
	const [curso, setCurso] = useState("");
	const [situacao, setSituacao] = useState("");

	const lista = alunos.filter(
		(a) =>
			(a.nome + a.matricula).toLowerCase().includes(busca.toLowerCase()) &&
			(!curso || a.curso === curso) &&
			(!situacao || a.situacao === situacao),
	);

	return (
		<>
			<Titulo titulo="Alunos" sub={`${lista.length} aluno(s) encontrado(s)`}>
				<Link href="/alunos/rascunhos" className={classeBotao("claro")}>Rascunhos</Link>
				<Link href="/alunos/novo" className={classeBotao("primario")}>+ Novo aluno</Link>
			</Titulo>

			<Cartao className="mb-4">
				<div className="grid gap-3 md:grid-cols-3">
					<Campo label="Buscar" value={busca} onChange={setBusca} placeholder="Nome ou matrícula" />
					<Campo label="Curso" value={curso} onChange={setCurso} opcoes={cursos.map((c) => c.nome)} />
					<Campo label="Situação" value={situacao} onChange={setSituacao} opcoes={["Ativa", "Trancada", "Concluída"]} />
				</div>
			</Cartao>

			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Aluno</th><th className="pb-2">Matrícula</th><th className="pb-2">Curso</th>
							<th className="pb-2">Turma</th><th className="pb-2">Situação</th><th className="pb-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map((a) => (
							<tr key={a.id} className="border-t border-linha">
								<td className="py-2 font-medium">{a.nome}</td>
								<td className="py-2 font-mono text-xs">{a.matricula}</td>
								<td className="py-2">{a.curso}</td>
								<td className="py-2">{a.turma}</td>
								<td className="py-2"><Chip tom={tomSituacao(a.situacao)}>{a.situacao}</Chip></td>
								<td className="space-x-3 py-2 text-right">
									<Link href={`/alunos/${a.id}`} className="text-vermelho hover:underline">Visualizar</Link>
									<Link href={`/alunos/${a.id}/editar`} className="text-vermelho hover:underline">Editar</Link>
								</td>
							</tr>
						))}
						{lista.length === 0 && (
							<tr><td colSpan={6} className="py-8 text-center text-suave">Nenhum aluno encontrado.</td></tr>
						)}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}