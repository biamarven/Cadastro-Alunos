"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Chip, classeBotao, tomSituacao } from "@/components/ui";
import { emitirHistorico } from "./actions";

type Disciplina = { periodo: string; nome: string; carga: number; media: number | null; situacao: string };
type Emissao = { codigo: string; tipo: string; emitidoEm: string; emitidoPor: string };

const SITUACOES: Record<string, string> = {
	em_andamento: "Em andamento",
	aprovado: "Aprovado",
	recuperacao: "Recuperação",
	reprovado: "Reprovado",
};

const TIPOS: Record<string, string> = {
	completo: "Completo",
	somente_concluidos: "Somente concluídos",
};

function formatar(n: number) {
	return n.toFixed(1).replace(".", ",");
}

export default function HistoricoMatricula({
	alunoNome,
	matricula,
	disciplinas,
	emissoes,
}: {
	alunoNome: string;
	matricula: { id: string; numero: string; curso: string; situacao: string };
	disciplinas: Disciplina[];
	emissoes: Emissao[];
}) {
	const router = useRouter();
	const [emitindo, iniciar] = useTransition();
	const [tipo, setTipo] = useState("Completo");
	const [erro, setErro] = useState("");
	const [emissao, setEmissao] = useState<{ codigo: string; emitidoEm: string } | null>(null);

	const somenteConcluidos = tipo === "Somente concluídos";
	const visiveis = disciplinas.filter(
		(d) => !somenteConcluidos || d.situacao === "aprovado" || d.situacao === "reprovado",
	);
	const periodos = Array.from(new Set(visiveis.map((d) => d.periodo)));
	const medias = visiveis.filter((d) => d.media !== null).map((d) => d.media as number);
	const geral = medias.length > 0 ? medias.reduce((s, m) => s + m, 0) / medias.length : null;

	function emitir() {
		setErro("");
		iniciar(async () => {
			const r = await emitirHistorico(matricula.id, somenteConcluidos ? "somente_concluidos" : "completo");
			if (r.erro || !r.codigo) {
				setErro(r.erro ?? "Não foi possível emitir.");
				return;
			}
			setEmissao({ codigo: r.codigo, emitidoEm: r.emitidoEm ?? "" });
			router.refresh();
			setTimeout(() => window.print(), 300);
		});
	}

	return (
		<Cartao titulo={`${alunoNome} · matrícula ${matricula.numero} · ${matricula.curso}`}>
			<div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
				<div className="w-56">
					<Campo label="Tipo de histórico" value={tipo} onChange={setTipo} opcoes={Object.values(TIPOS)} />
				</div>
				<button className={classeBotao("primario")} disabled={emitindo} onClick={emitir}>
					{emitindo ? "Emitindo..." : "Emitir e imprimir"}
				</button>
			</div>
			{erro && <p className="mb-3 text-sm text-vermelho print:hidden">{erro}</p>}

			{periodos.length === 0 ? (
				<p className="text-sm text-suave">
					{somenteConcluidos
						? "Nenhuma disciplina concluída até agora."
						: "Este aluno ainda não cursou nenhuma disciplina."}
				</p>
			) : (
				<div className="space-y-5">
					{periodos.map((p) => (
						<div key={p}>
							<p className="mb-1 text-sm font-semibold">Período {p}</p>
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase text-suave">
										<th className="pb-2">Disciplina</th>
										<th className="pb-2">Carga</th>
										<th className="pb-2">Média</th>
										<th className="pb-2">Situação</th>
									</tr>
								</thead>
								<tbody>
									{visiveis
										.filter((d) => d.periodo === p)
										.map((d) => (
											<tr key={d.nome} className="border-t border-linha">
												<td className="py-2">{d.nome}</td>
												<td className="py-2">{d.carga} h</td>
												<td className="py-2 font-mono">{d.media === null ? "—" : formatar(d.media)}</td>
												<td className="py-2">
													<Chip tom={tomSituacao(SITUACOES[d.situacao] ?? d.situacao)}>
														{SITUACOES[d.situacao] ?? d.situacao}
													</Chip>
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					))}
					<p className="text-right text-sm">
						Média geral: <strong className="font-mono">{geral === null ? "—" : formatar(geral)}</strong>
					</p>
				</div>
			)}

			{emissao && (
				<p className="mt-4 border-t border-linha pt-3 text-xs text-suave">
					Emitido em {emissao.emitidoEm} · Código de autenticação:{" "}
					<span className="font-mono">{emissao.codigo}</span>
				</p>
			)}

			{emissoes.length > 0 && (
				<div className="mt-5 border-t border-linha pt-4 print:hidden">
					<p className="mb-2 text-sm font-semibold">Emissões anteriores</p>
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase text-suave">
								<th className="pb-2">Código</th>
								<th className="pb-2">Tipo</th>
								<th className="pb-2">Emitido em</th>
								<th className="pb-2">Por</th>
							</tr>
						</thead>
						<tbody>
							{emissoes.map((e) => (
								<tr key={e.codigo} className="border-t border-linha">
									<td className="py-2 font-mono text-xs">{e.codigo}</td>
									<td className="py-2">{TIPOS[e.tipo] ?? e.tipo}</td>
									<td className="py-2">{e.emitidoEm}</td>
									<td className="py-2">{e.emitidoPor}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Cartao>
	);
}