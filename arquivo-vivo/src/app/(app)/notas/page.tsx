"use client";

import { useState } from "react";
import { Campo, Cartao, Chip, Titulo, classeBotao, tomSituacao } from "@/components/ui";
import { cursos, notasTurma, turmas } from "@/lib/mock";
import { calcular } from "@/lib/notas";

type Campos = "n1" | "n2" | "n3";
const campos: Campos[] = ["n1", "n2", "n3"];

export default function NotasPage() {
	const [periodo, setPeriodo] = useState("2026.2");
	const [curso, setCurso] = useState("Técnico em Informática");
	const [turma, setTurma] = useState("INF-1A");
	const [disciplina, setDisciplina] = useState("Lógica de Programação");
	const [busca, setBusca] = useState("");
	const [soPendentes, setSoPendentes] = useState(false);
	const [linhas, setLinhas] = useState(notasTurma);
	const [justificativa, setJustificativa] = useState("");
	const [mensagem, setMensagem] = useState("");

	function alterar(id: string, campo: Campos, valor: string) {
		setMensagem("");
		setLinhas(linhas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
	}

	// Nota que já existia e foi mudada exige justificativa (correção).
	const corrigidas = linhas.filter((l) => {
		const o = notasTurma.find((x) => x.id === l.id)!;
		return campos.some((c) => o[c] !== "" && l[c] !== o[c]);
	});

	const visiveis = linhas.filter((l) => {
		const pendente = calcular(l.n1, l.n2, l.n3).situacao === "Em andamento";
		return (l.nome + l.matricula).toLowerCase().includes(busca.toLowerCase()) && (!soPendentes || pendente);
	});

	function salvar() {
		if (corrigidas.length > 0 && justificativa.trim().length < 10) {
			setMensagem("Há notas corrigidas: escreva a justificativa (mínimo 10 caracteres).");
			return;
		}
		setMensagem("Notas salvas (simulação). O professor responsável será notificado das correções.");
	}

	return (
		<>
			<Titulo titulo="Lançamento de notas" sub="Escolha a turma e a disciplina. Média = N1 30% + N2 30% + N3 40%." />

			<Cartao className="mb-4">
				<div className="grid gap-3 md:grid-cols-4">
					<Campo label="Período" value={periodo} onChange={setPeriodo} opcoes={["2026.1", "2026.2"]} />
					<Campo label="Curso" value={curso} onChange={setCurso} opcoes={cursos.map((c) => c.nome)} />
					<Campo label="Turma" value={turma} onChange={setTurma} opcoes={turmas.map((t) => t.codigo)} />
					<Campo label="Disciplina" value={disciplina} onChange={setDisciplina}
						opcoes={["Lógica de Programação", "Matemática Aplicada", "Inglês Instrumental"]} />
				</div>
				<div className="mt-3 grid items-end gap-3 md:grid-cols-[1fr_auto]">
					<Campo label="Buscar aluno" value={busca} onChange={setBusca} placeholder="Nome ou matrícula" />
					<label className="flex items-center gap-2 pb-2 text-sm">
						<input type="checkbox" checked={soPendentes} onChange={(e) => setSoPendentes(e.target.checked)} />
						Mostrar só pendentes
					</label>
				</div>
			</Cartao>

			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Aluno</th><th className="pb-2">Matrícula</th>
							<th className="pb-2">N1 (30%)</th><th className="pb-2">N2 (30%)</th><th className="pb-2">N3 (40%)</th>
							<th className="pb-2">Média</th><th className="pb-2">Situação</th>
						</tr>
					</thead>
					<tbody>
						{visiveis.map((l) => {
							const r = calcular(l.n1, l.n2, l.n3);
							return (
								<tr key={l.id} className="border-t border-linha">
									<td className="py-2 font-medium">{l.nome}</td>
									<td className="py-2 font-mono text-xs">{l.matricula}</td>
									{campos.map((c) => (
										<td key={c} className="py-2">
											<input
												inputMode="decimal"
												value={l[c]}
												onChange={(e) => alterar(l.id, c, e.target.value)}
												className="w-16 rounded-md border border-linha bg-white px-2 py-1 text-center font-mono text-sm outline-none focus:border-vermelho"
											/>
										</td>
									))}
									<td className="py-2 font-mono">{r.media === null ? "—" : r.media.toFixed(1).replace(".", ",")}</td>
									<td className="py-2"><Chip tom={tomSituacao(r.situacao)}>{r.situacao}</Chip></td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{corrigidas.length > 0 && (
					<div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3">
						<p className="mb-2 text-sm font-semibold text-amber-900">
							{corrigidas.length} aluno(s) com nota corrigida. Justifique:
						</p>
						<textarea
							value={justificativa}
							onChange={(e) => setJustificativa(e.target.value)}
							rows={3}
							className="w-full rounded-md border border-linha bg-white p-2 text-sm outline-none focus:border-vermelho"
							placeholder="Ex.: erro de digitação na primeira entrada."
						/>
					</div>
				)}

				{mensagem && <p className="mt-3 text-sm text-suave">{mensagem}</p>}

				<div className="mt-4 flex justify-end">
					<button className={classeBotao("primario")} onClick={salvar}>Salvar notas</button>
				</div>
			</Cartao>
		</>
	);
}