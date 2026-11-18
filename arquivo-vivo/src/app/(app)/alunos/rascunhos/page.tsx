"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cartao, Titulo, classeBotao } from "@/components/ui";

type Rascunho = { id: string; form: { nome: string; curso: string }; passo: number; salvoEm: string };
const CHAVE = "av_rascunhos";

export default function RascunhosPage() {
	const [lista, setLista] = useState<Rascunho[]>([]);

	useEffect(() => {
		setLista(JSON.parse(localStorage.getItem(CHAVE) ?? "[]"));
	}, []);

	function descartar(id: string) {
		const nova = lista.filter((r) => r.id !== id);
		localStorage.setItem(CHAVE, JSON.stringify(nova));
		setLista(nova);
	}

	return (
		<>
			<Titulo titulo="Rascunhos de cadastro" sub="Cadastros iniciados e não concluídos. Rascunhos são descartados após 30 dias.">
				<Link href="/alunos" className={classeBotao("claro")}>Voltar para alunos</Link>
			</Titulo>
			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Aluno</th><th className="pb-2">Curso</th><th className="pb-2">Etapa</th>
							<th className="pb-2">Salvo em</th><th className="pb-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map((r) => (
							<tr key={r.id} className="border-t border-linha">
								<td className="py-2 font-medium">{r.form.nome || "(sem nome)"}</td>
								<td className="py-2">{r.form.curso || "—"}</td>
								<td className="py-2">Etapa {r.passo + 1}</td>
								<td className="py-2">{new Date(r.salvoEm).toLocaleString("pt-BR")}</td>
								<td className="space-x-3 py-2 text-right">
									<Link href={`/alunos/novo?rascunho=${r.id}`} className="text-vermelho hover:underline">Retomar</Link>
									<button onClick={() => descartar(r.id)} className="text-suave hover:text-vermelho">Descartar</button>
								</td>
							</tr>
						))}
						{lista.length === 0 && (
							<tr><td colSpan={5} className="py-8 text-center text-suave">Nenhum rascunho salvo.</td></tr>
						)}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}