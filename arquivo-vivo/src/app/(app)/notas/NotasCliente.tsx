"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Chip, Titulo, classeBotao, tomSituacao } from "@/components/ui";
import { converter } from "@/lib/notas";
import { salvarNotas } from "./actions";

export type OfertaOpcao = { id: string; periodo: string; curso: string; turma: string; disciplina: string };

type Avaliacao = { id: string; nome: string; peso: number };
type Linha = {
	mdId: string;
	nome: string;
	matricula: string;
	situacaoMatricula: string;
	notas: Record<string, number | null>;
	media: number | null;
	situacao: string;
};
export type Selecionada = {
	id: string;
	encerrada: boolean;
	avaliacoes: Avaliacao[];
	linhas: Linha[];
	chave: string;
};

const MOTIVOS: Record<string, string> = {
	erro_digitacao: "Erro de digitação",
	revisao_prova: "Revisão de prova",
	outro: "Outro",
};

function unicos(lista: string[]) {
	return Array.from(new Set(lista));
}

function formatar(n: number) {
	return String(n).replace(".", ",");
}

function TabelaNotas({
	selecionada,
	podeEditar,
	aprovacao,
	recuperacao,
}: {
	selecionada: Selecionada;
	podeEditar: boolean;
	aprovacao: number;
	recuperacao: number;
}) {
	const router = useRouter();
	const [salvando, iniciar] = useTransition();
	const [valores, setValores] = useState<Record<string, string>>(() => {
		const inicial: Record<string, string> = {};
		for (const l of selecionada.linhas) {
			for (const a of selecionada.avaliacoes) {
				const v = l.notas[a.id];
				inicial[`${l.mdId}:${a.id}`] = v === null || v === undefined ? "" : formatar(v);
			}
		}
		return inicial;
	});
	const [busca, setBusca] = useState("");
	const [soPendentes, setSoPendentes] = useState(false);
	const [motivo, setMotivo] = useState("Erro de digitação");
	const [justificativa, setJustificativa] = useState("");
	const [erro, setErro] = useState("");
	const [mensagem, setMensagem] = useState("");

	function previa(l: Linha) {
		const ns = selecionada.avaliacoes.map((a) => converter(valores[`${l.mdId}:${a.id}`] ?? ""));
		if (ns.length === 0 || ns.some((n) => n === null)) return { media: null as number | null, situacao: "Em andamento" };
		const somaPesos = selecionada.avaliacoes.reduce((s, a) => s + a.peso, 0);
		const soma = selecionada.avaliacoes.reduce((s, a, i) => s + (ns[i] as number) * a.peso, 0);
		const media = Math.round((soma / somaPesos + 1e-9) * 10) / 10;
		if (media >= aprovacao) return { media, situacao: "Aprovado" };
		if (media >= recuperacao) return { media, situacao: "Recuperação" };
		return { media, situacao: "Reprovado" };
	}

	const alteradas: { matriculaDisciplinaId: string; avaliacaoId: string; valor: string; corrige: boolean }[] = [];
	let invalido = false;
	let apagouNota = false;
	for (const l of selecionada.linhas) {
		for (const a of selecionada.avaliacoes) {
			const texto = (valores[`${l.mdId}:${a.id}`] ?? "").trim();
			const original = l.notas[a.id] ?? null;
			if (texto === "") {
				if (original !== null) apagouNota = true;
				continue;
			}
			const n = converter(texto);
			if (n === null) {
				invalido = true;
				continue;
			}
			if (original === null || Math.round(n * 100) / 100 !== original) {
				alteradas.push({ matriculaDisciplinaId: l.mdId, avaliacaoId: a.id, valor: texto, corrige: original !== null });
			}
		}
	}
	const corrigidas = alteradas.filter((a) => a.corrige).length;

	const visiveis = selecionada.linhas.filter((l) => {
		const pendente = previa(l).media === null;
		return (l.nome + l.matricula).toLowerCase().includes(busca.toLowerCase()) && (!soPendentes || pendente);
	});

	function alterar(chave: string, valor: string) {
		setMensagem("");
		setErro("");
		setValores((v) => ({ ...v, [chave]: valor }));
	}

	function salvar() {
		setErro("");
		setMensagem("");
		if (invalido) {
			setErro("Há notas inválidas: use valores de 0 a 10.");
			return;
		}
		if (apagouNota) {
			setErro("Não é possível apagar uma nota já lançada. Informe o novo valor.");
			return;
		}
		if (alteradas.length === 0) {
			setMensagem("Nenhuma alteração para salvar.");
			return;
		}
				const motivoCodigo = Object.keys(MOTIVOS).find((k) => MOTIVOS[k] === motivo) ?? "outro";
		if (corrigidas > 0 && motivoCodigo === "outro" && justificativa.trim().length < 5) {
			setErro('No motivo "Outro", descreva o que aconteceu (mínimo 5 caracteres).');
			return;
		}
		iniciar(async () => {
			const r = await salvarNotas(
				selecionada.id,
				alteradas.map((a) => ({
					matriculaDisciplinaId: a.matriculaDisciplinaId,
					avaliacaoId: a.avaliacaoId,
					valor: a.valor,
				})),
				motivoCodigo,
				justificativa,
			);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			setJustificativa("");
			setMensagem("Notas salvas.");
			router.refresh();
		});
	}

	const bloqueada = !podeEditar || selecionada.encerrada;

	return (
		<Cartao>
			<div className="mb-4 grid items-end gap-3 md:grid-cols-[1fr_auto]">
				<Campo label="Buscar aluno" value={busca} onChange={setBusca} placeholder="Nome ou matrícula" />
				<label className="flex items-center gap-2 pb-2 text-sm">
					<input type="checkbox" checked={soPendentes} onChange={(e) => setSoPendentes(e.target.checked)} />
					Mostrar só pendentes
				</label>
			</div>

			{selecionada.encerrada && (
				<p className="mb-3 text-sm text-suave">Esta disciplina está encerrada. As notas não podem mais ser alteradas.</p>
			)}

			<table className="w-full text-sm">
				<thead>
					<tr className="text-left text-xs uppercase text-suave">
						<th className="pb-2">Aluno</th>
						<th className="pb-2">Matrícula</th>
						{selecionada.avaliacoes.map((a) => (
							<th key={a.id} className="pb-2">{a.nome} ({formatar(a.peso)}%)</th>
						))}
						<th className="pb-2">Média</th>
						<th className="pb-2">Situação</th>
					</tr>
				</thead>
				<tbody>
					{visiveis.map((l) => {
						const r = previa(l);
						const travada = bloqueada || l.situacaoMatricula !== "ativa";
						return (
							<tr key={l.mdId} className="border-t border-linha">
								<td className="py-2 font-medium">
									{l.nome}
									{l.situacaoMatricula !== "ativa" && (
										<span className="ml-2 text-xs text-suave">(matrícula {l.situacaoMatricula})</span>
									)}
								</td>
								<td className="py-2 font-mono text-xs">{l.matricula}</td>
								{selecionada.avaliacoes.map((a) => (
									<td key={a.id} className="py-2">
										<input
											inputMode="decimal"
											disabled={travada}
											value={valores[`${l.mdId}:${a.id}`] ?? ""}
											onChange={(e) => alterar(`${l.mdId}:${a.id}`, e.target.value)}
											className="w-16 rounded-md border border-linha bg-white px-2 py-1 text-center font-mono text-sm outline-none focus:border-vermelho disabled:opacity-50"
										/>
									</td>
								))}
								<td className="py-2 font-mono">{r.media === null ? "—" : formatar(r.media)}</td>
								<td className="py-2"><Chip tom={tomSituacao(r.situacao)}>{r.situacao}</Chip></td>
							</tr>
						);
					})}
					{visiveis.length === 0 && (
						<tr>
							<td colSpan={selecionada.avaliacoes.length + 4} className="py-6 text-center text-suave">
								Nenhum aluno encontrado nesta disciplina.
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{corrigidas > 0 && (
				<div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3">
					<p className="mb-2 text-sm font-semibold text-amber-900">
												{corrigidas} nota(s) corrigida(s). Escolha o motivo; a justificativa só é obrigatória em "Outro".
					</p>
					<div className="mb-2 max-w-xs">
						<Campo label="Motivo" value={motivo} onChange={setMotivo} opcoes={Object.values(MOTIVOS)} />
					</div>
					<textarea
						value={justificativa}
						onChange={(e) => setJustificativa(e.target.value)}
						rows={3}
						className="w-full rounded-md border border-linha bg-white p-2 text-sm outline-none focus:border-vermelho"
												placeholder="Justificativa (opcional, exceto em Outro)"
					/>
				</div>
			)}

			{erro && <p className="mt-3 text-sm text-vermelho">{erro}</p>}
			{mensagem && !erro && <p className="mt-3 text-sm text-suave">{mensagem}</p>}

			{!bloqueada && (
				<div className="mt-4 flex justify-end">
					<button className={classeBotao("primario")} disabled={salvando} onClick={salvar}>
						{salvando ? "Salvando..." : "Salvar notas"}
					</button>
				</div>
			)}
		</Cartao>
	);
}

export default function NotasCliente({
	ofertas,
	selecionada,
	podeEditar,
	aprovacao,
	recuperacao,
}: {
	ofertas: OfertaOpcao[];
	selecionada: Selecionada | null;
	podeEditar: boolean;
	aprovacao: number;
	recuperacao: number;
}) {
	const router = useRouter();
	const meta = ofertas.find((o) => o.id === selecionada?.id);
	const [periodo, setPeriodo] = useState(meta?.periodo ?? "");
	const [curso, setCurso] = useState(meta?.curso ?? "");
	const [turma, setTurma] = useState(meta?.turma ?? "");

	const periodos = unicos(ofertas.map((o) => o.periodo));
	const periodoAtual = periodos.includes(periodo) ? periodo : (periodos[0] ?? "");
	const cursos = unicos(ofertas.filter((o) => o.periodo === periodoAtual).map((o) => o.curso));
	const cursoAtual = cursos.includes(curso) ? curso : (cursos[0] ?? "");
	const turmas = unicos(
		ofertas.filter((o) => o.periodo === periodoAtual && o.curso === cursoAtual).map((o) => o.turma),
	);
	const turmaAtual = turmas.includes(turma) ? turma : (turmas[0] ?? "");
	const disciplinas = ofertas.filter(
		(o) => o.periodo === periodoAtual && o.curso === cursoAtual && o.turma === turmaAtual,
	);
	const escolhida = disciplinas.find((o) => o.id === selecionada?.id);

	return (
		<>
			<Titulo
				titulo="Lançamento de notas"
				sub="Escolha a turma e a disciplina. A média é ponderada pelos pesos de cada avaliação."
			/>

			{ofertas.length === 0 ? (
				<Cartao>
					<p className="text-sm text-suave">
						Nenhuma disciplina disponível para você. As ofertas são criadas na tela do curso, em Cursos e turmas.
					</p>
				</Cartao>
			) : (
				<>
					<Cartao className="mb-4">
						<div className="grid gap-3 md:grid-cols-4">
							<Campo label="Período" value={periodoAtual} onChange={setPeriodo} opcoes={periodos} />
							<Campo label="Curso" value={cursoAtual} onChange={setCurso} opcoes={cursos} />
							<Campo label="Turma" value={turmaAtual} onChange={setTurma} opcoes={turmas} />
							<Campo
								label="Disciplina"
								value={escolhida ? escolhida.disciplina : ""}
								onChange={(nome) => {
									const o = disciplinas.find((d) => d.disciplina === nome);
									if (o) router.push(`/notas?oferta=${o.id}`);
								}}
								opcoes={disciplinas.map((d) => d.disciplina)}
							/>
						</div>
					</Cartao>

					{selecionada && escolhida ? (
						<TabelaNotas
							key={`${selecionada.id}-${selecionada.chave}`}
							selecionada={selecionada}
							podeEditar={podeEditar}
							aprovacao={aprovacao}
							recuperacao={recuperacao}
						/>
					) : (
						<Cartao>
							<p className="text-sm text-suave">Escolha a disciplina para ver os alunos e lançar as notas.</p>
						</Cartao>
					)}
				</>
			)}
		</>
	);
}