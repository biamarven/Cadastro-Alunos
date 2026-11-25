"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import { turnos } from "@/lib/rotulos";
import { adicionarDisciplinaMatriz, criarOferta, definirProfessor, removerDisciplinaMatriz } from "./actions";

type Disciplina = { id: string; nome: string; periodo: number; carga: number; tipo: string };
type Turma = { id: string; codigo: string; periodoCurso: number; turno: string; periodo: string };
type Oferta = { id: string; turmaId: string; cursoDisciplinaId: string; disciplina: string; professorId: string };
type Professor = { id: string; nome: string };

const TIPOS: Record<string, string> = { obrigatoria: "Obrigatória", optativa: "Optativa" };

export default function CursoDisciplinasCliente({
	curso,
	podeEditar,
	matriz,
	turmas,
	ofertas,
	professores,
}: {
	curso: { id: string; duracao: number };
	podeEditar: boolean;
	matriz: Disciplina[];
	turmas: Turma[];
	ofertas: Oferta[];
	professores: Professor[];
}) {
	const router = useRouter();
	const [pendente, iniciar] = useTransition();
	const [erroMatriz, setErroMatriz] = useState("");
	const [erroOferta, setErroOferta] = useState("");

	const [nome, setNome] = useState("");
	const [periodoNovo, setPeriodoNovo] = useState("1");
	const [carga, setCarga] = useState("");
	const [tipoNovo, setTipoNovo] = useState("Obrigatória");

	const [turmaCodigo, setTurmaCodigo] = useState("");
	const [disciplinaNome, setDisciplinaNome] = useState("");
	const [professorNome, setProfessorNome] = useState("Sem professor");

	const turmaSel = turmas.find((t) => t.codigo === turmaCodigo) ?? turmas[0];
	const ofertasDaTurma = turmaSel ? ofertas.filter((o) => o.turmaId === turmaSel.id) : [];
	const jaOfertadas = new Set(ofertasDaTurma.map((o) => o.cursoDisciplinaId));
	const candidatas = turmaSel
		? matriz.filter((d) => d.periodo === turmaSel.periodoCurso && !jaOfertadas.has(d.id))
		: [];
	const disciplinaSel = candidatas.find((d) => d.nome === disciplinaNome) ?? candidatas[0];
	const professorSel = professores.find((p) => p.nome === professorNome);

	function adicionar() {
		setErroMatriz("");
		iniciar(async () => {
			const r = await adicionarDisciplinaMatriz(curso.id, {
				nome,
				periodo: Number(periodoNovo),
				cargaHoraria: Number(carga),
				tipo: tipoNovo === "Optativa" ? "optativa" : "obrigatoria",
			});
			if (r.erro) {
				setErroMatriz(r.erro);
				return;
			}
			setNome("");
			setCarga("");
			router.refresh();
		});
	}

	function remover(d: Disciplina) {
		if (!window.confirm(`Remover ${d.nome} da matriz?`)) return;
		setErroMatriz("");
		iniciar(async () => {
			const r = await removerDisciplinaMatriz(d.id);
			if (r.erro) {
				setErroMatriz(r.erro);
				return;
			}
			router.refresh();
		});
	}

	function ofertar() {
		if (!turmaSel || !disciplinaSel) return;
		setErroOferta("");
		iniciar(async () => {
			const r = await criarOferta(turmaSel.id, disciplinaSel.id, professorSel ? professorSel.id : null);
			if (r.erro) {
				setErroOferta(r.erro);
				return;
			}
			router.refresh();
		});
	}

	function trocarProfessor(ofertaId: string, valor: string) {
		setErroOferta("");
		iniciar(async () => {
			const r = await definirProfessor(ofertaId, valor === "" ? null : valor);
			if (r.erro) {
				setErroOferta(r.erro);
				return;
			}
			router.refresh();
		});
	}

	return (
		<div className="space-y-6">
			<Cartao titulo="Matriz curricular">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Período</th>
							<th className="pb-2">Disciplina</th>
							<th className="pb-2">Carga</th>
							<th className="pb-2">Tipo</th>
							<th className="pb-2 text-right"></th>
						</tr>
					</thead>
					<tbody>
						{matriz.map((d) => (
							<tr key={d.id} className="border-t border-linha">
								<td className="py-2">{d.periodo}º</td>
								<td className="py-2 font-medium">{d.nome}</td>
								<td className="py-2">{d.carga} h</td>
								<td className="py-2">{TIPOS[d.tipo] ?? d.tipo}</td>
								<td className="py-2 text-right">
									{podeEditar && (
										<button
											type="button"
											disabled={pendente}
											onClick={() => remover(d)}
											className="text-suave hover:text-vermelho"
										>
											Remover
										</button>
									)}
								</td>
							</tr>
						))}
						{matriz.length === 0 && (
							<tr>
								<td colSpan={5} className="py-6 text-center text-suave">Nenhuma disciplina na matriz ainda.</td>
							</tr>
						)}
					</tbody>
				</table>

				{podeEditar && (
					<div className="mt-5 border-t border-linha pt-4">
						<p className="mb-3 text-sm font-semibold">Adicionar disciplina</p>
						<div className="grid gap-3 md:grid-cols-4">
							<Campo className="md:col-span-2" label="Nome da disciplina" value={nome} onChange={setNome} />
							<Campo
								label="Período do curso"
								value={periodoNovo}
								onChange={setPeriodoNovo}
								opcoes={Array.from({ length: curso.duracao }, (_, i) => String(i + 1))}
							/>
							<Campo label="Carga horária (h)" type="number" value={carga} onChange={setCarga} />
							<Campo label="Tipo" value={tipoNovo} onChange={setTipoNovo} opcoes={Object.values(TIPOS)} />
						</div>
						{erroMatriz && <p className="mt-3 text-sm text-vermelho">{erroMatriz}</p>}
						<div className="mt-3 flex justify-end">
							<button
								type="button"
								disabled={pendente || nome.trim() === "" || carga === ""}
								onClick={adicionar}
								className={classeBotao("primario")}
							>
								{pendente ? "Salvando..." : "Adicionar à matriz"}
							</button>
						</div>
					</div>
				)}
				{!podeEditar && erroMatriz && <p className="mt-3 text-sm text-vermelho">{erroMatriz}</p>}
			</Cartao>

			<Cartao titulo="Ofertas por turma">
				{turmas.length === 0 ? (
					<p className="text-sm text-suave">Este curso ainda não tem turmas. Crie uma turma na tela de cursos.</p>
				) : (
					<>
						<div className="mb-4 max-w-md">
							<Campo
								label="Turma"
								value={turmaSel ? turmaSel.codigo : ""}
								onChange={(v) => {
									setTurmaCodigo(v);
									setDisciplinaNome("");
								}}
								opcoes={turmas.map((t) => t.codigo)}
							/>
							{turmaSel && (
								<p className="mt-1 text-xs text-suave">
									Período letivo {turmaSel.periodo} · {turmaSel.periodoCurso}º período do curso · {turnos[turmaSel.turno]}
								</p>
							)}
						</div>

						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase text-suave">
									<th className="pb-2">Disciplina</th>
									<th className="pb-2">Professor</th>
								</tr>
							</thead>
							<tbody>
								{ofertasDaTurma.map((o) => (
									<tr key={o.id} className="border-t border-linha">
										<td className="py-2 font-medium">{o.disciplina}</td>
										<td className="py-2">
											{podeEditar ? (
												<select
													value={o.professorId}
													disabled={pendente}
													onChange={(e) => trocarProfessor(o.id, e.target.value)}
													className="rounded-md border border-linha bg-white px-2 py-1 text-sm"
												>
													<option value="">Sem professor</option>
													{professores.map((p) => (
														<option key={p.id} value={p.id}>{p.nome}</option>
													))}
												</select>
											) : (
												(professores.find((p) => p.id === o.professorId)?.nome ?? "Sem professor")
											)}
										</td>
									</tr>
								))}
								{ofertasDaTurma.length === 0 && (
									<tr>
										<td colSpan={2} className="py-6 text-center text-suave">Nenhuma disciplina ofertada nesta turma.</td>
									</tr>
								)}
							</tbody>
						</table>

						{podeEditar && (
							<div className="mt-5 border-t border-linha pt-4">
								<p className="mb-3 text-sm font-semibold">Ofertar disciplina nesta turma</p>
								{candidatas.length === 0 ? (
									<p className="text-sm text-suave">
										Não há disciplina do {turmaSel?.periodoCurso}º período da matriz para ofertar.
									</p>
								) : (
									<div className="grid gap-3 md:grid-cols-2">
										<Campo
											label="Disciplina"
											value={disciplinaSel ? disciplinaSel.nome : ""}
											onChange={setDisciplinaNome}
											opcoes={candidatas.map((d) => d.nome)}
										/>
										<Campo
											label="Professor"
											value={professorNome}
											onChange={setProfessorNome}
											opcoes={["Sem professor", ...professores.map((p) => p.nome)]}
										/>
									</div>
								)}
								{erroOferta && <p className="mt-3 text-sm text-vermelho">{erroOferta}</p>}
								<div className="mt-3 flex justify-end">
									<button
										type="button"
										disabled={pendente || !disciplinaSel}
										onClick={ofertar}
										className={classeBotao("primario")}
									>
										{pendente ? "Salvando..." : "Ofertar disciplina"}
									</button>
								</div>
							</div>
						)}
						{!podeEditar && erroOferta && <p className="mt-3 text-sm text-vermelho">{erroOferta}</p>}
					</>
				)}
			</Cartao>
		</div>
	);
}