import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { Cartao, Chip, Titulo, tomSituacao } from "@/components/ui";
import { alunos, historico } from "@/lib/mock";

export default async function HistoricoPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const aluno = alunos.find((a) => a.id === id);
	if (!aluno) notFound();

	const todas = historico.flatMap((s) => s.disciplinas);
	const geral = todas.reduce((soma, d) => soma + d.media, 0) / todas.length;

	return (
		<>
			<Titulo titulo="Histórico escolar" sub={`${aluno.nome} · ${aluno.matricula} · ${aluno.curso}`}>
				<PrintButton />
			</Titulo>

			<div className="space-y-6">
				{historico.map((s) => (
					<Cartao key={s.periodo} titulo={`Período ${s.periodo}`}>
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase text-suave">
									<th className="pb-2">Disciplina</th><th className="pb-2">Média</th><th className="pb-2">Situação</th>
								</tr>
							</thead>
							<tbody>
								{s.disciplinas.map((d) => (
									<tr key={d.nome} className="border-t border-linha">
										<td className="py-2">{d.nome}</td>
										<td className="py-2 font-mono">{d.media.toFixed(1).replace(".", ",")}</td>
										<td className="py-2"><Chip tom={tomSituacao(d.situacao)}>{d.situacao}</Chip></td>
									</tr>
								))}
							</tbody>
						</table>
					</Cartao>
				))}
				<p className="text-right text-sm">
					Média geral: <strong className="font-mono">{geral.toFixed(1).replace(".", ",")}</strong>
				</p>
			</div>
		</>
	);
}