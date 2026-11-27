"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import Modal from "@/components/Modal";
import { Campo, Cartao, Chip, Titulo, classeBotao } from "@/components/ui";
import { codigoDe, modalidades, niveis, rotulosDe, situacoesCurso, turnos } from "@/lib/rotulos";
import { criarCurso, criarPeriodo, criarTurma } from "./actions";

export type CursoLinha = {
	id: string;
	codigo: string;
	nome: string;
	nivel: string;
	modalidade: string;
	carga: number;
	duracao: number;
	vagasPorTurma: number | null;
	situacao: string;
	turnos: string[];
	alunos: number;
	turmas: number;
};

export type PeriodoLinha = { id: string; codigo: string; atual: boolean };

export type TurmaLinha = {
	id: string;
	codigo: string;
	curso: string;
	periodo: string;
	turno: string;
	vagas: number;
	matriculados: number;
	professores: string;
	situacao: string;
};

const cursoVazio = {
	nome: "",
	codigo: "",
	nivel: niveis.graduacao,
	modalidade: modalidades.presencial,
	situacao: situacoesCurso.ativo,
	carga: "",
	duracao: "",
	vagas: "",
	turnos: [] as string[],
};

const turmaVazia = {
	curso: "",
	periodo: "",
	letra: "A",
	periodoCurso: "1",
	turno: "",
	vagas: "",
};

export default function CursosCliente({
	podeEditar,
	cursos,
	periodos,
	turmas,
}: {
	podeEditar: boolean;
	cursos: CursoLinha[];
	periodos: PeriodoLinha[];
	turmas: TurmaLinha[];
}) {
	const [modal, setModal] = useState<"curso" | "periodo" | "turma" | null>(null);
	const [erro, setErro] = useState("");
	const [ocupado, iniciar] = useTransition();

	const [curso, setCurso] = useState(cursoVazio);
	const [periodoNovo, setPeriodoNovo] = useState({
		ano: String(new Date().getFullYear()),
		semestre: "1",
		inicio: "",
		fim: "",
		atual: false,
	});
	const [turma, setTurma] = useState(turmaVazia);

	const padrao = periodos.find((p) => p.atual)?.codigo ?? periodos[0]?.codigo ?? "";
	const [periodoFiltro, setPeriodoFiltro] = useState(padrao);

	const cursoDaTurma = cursos.find((c) => c.nome === turma.curso);
	const turnosDaTurma = cursoDaTurma
		? cursoDaTurma.turnos.map((t) => turnos[t])
		: rotulosDe(turnos);

	function abrir(qual: "curso" | "periodo" | "turma") {
		setErro("");
		if (qual === "curso") setCurso(cursoVazio);
		if (qual === "turma") setTurma({ ...turmaVazia, periodo: padrao });
		setModal(qual);
	}

	function alternarTurno(codigo: string) {
		setCurso({
			...curso,
			turnos: curso.turnos.includes(codigo)
				? curso.turnos.filter((t) => t !== codigo)
				: [...curso.turnos, codigo],
		});
	}

	function escolherCurso(nome: string) {
		const escolhido = cursos.find((c) => c.nome === nome);
		setTurma({
			...turma,
			curso: nome,
			turno: escolhido && escolhido.turnos.length === 1 ? turnos[escolhido.turnos[0]] : "",
			vagas: escolhido?.vagasPorTurma ? String(escolhido.vagasPorTurma) : turma.vagas,
		});
	}

	function enviarCurso(e: FormEvent) {
		e.preventDefault();
		setErro("");
		iniciar(async () => {
			const resultado = await criarCurso({
				nome: curso.nome,
				codigo: curso.codigo,
				nivel: codigoDe(niveis, curso.nivel),
				modalidade: codigoDe(modalidades, curso.modalidade),
				situacao: codigoDe(situacoesCurso, curso.situacao),
				carga: Number(curso.carga),
				duracao: Number(curso.duracao),
				vagas: curso.vagas ? Number(curso.vagas) : null,
				turnos: curso.turnos,
			});
			if (resultado.erro) {
				setErro(resultado.erro);
				return;
			}
			setModal(null);
		});
	}

	function enviarPeriodo(e: FormEvent) {
		e.preventDefault();
		setErro("");
		iniciar(async () => {
			const resultado = await criarPeriodo({
				ano: Number(periodoNovo.ano),
				semestre: Number(periodoNovo.semestre),
				inicio: periodoNovo.inicio,
				fim: periodoNovo.fim,
				atual: periodoNovo.atual,
			});
			if (resultado.erro) {
				setErro(resultado.erro);
				return;
			}
			setModal(null);
			setPeriodoFiltro(`${periodoNovo.ano}.${periodoNovo.semestre}`);
		});
	}

	function enviarTurma(e: FormEvent) {
		e.preventDefault();
		setErro("");
		const periodo = periodos.find((p) => p.codigo === turma.periodo);
		if (!cursoDaTurma || !periodo) {
			setErro("Escolha o curso e o período letivo.");
			return;
		}
		iniciar(async () => {
			const resultado = await criarTurma({
				cursoId: cursoDaTurma.id,
				periodoId: periodo.id,
				letra: turma.letra,
				periodoCurso: Number(turma.periodoCurso),
				turno: codigoDe(turnos, turma.turno),
				vagas: Number(turma.vagas),
			});
			if (resultado.erro) {
				setErro(resultado.erro);
				return;
			}
			setModal(null);
			setPeriodoFiltro(turma.periodo);
		});
	}

	const turmasDoPeriodo = turmas.filter((t) => t.periodo === periodoFiltro);

	return (
		<>
			<Titulo titulo="Cursos e turmas" sub="Cursos oferecidos e turmas do período">
				{podeEditar && (
					<>
						<button className={classeBotao("claro")} onClick={() => abrir("periodo")}>+ Novo período</button>
						<button className={classeBotao("claro")} onClick={() => abrir("turma")} disabled={cursos.length === 0 || periodos.length === 0}>+ Nova turma</button>
						<button className={classeBotao("primario")} onClick={() => abrir("curso")}>+ Novo curso</button>
					</>
				)}
			</Titulo>

			{cursos.length === 0 ? (
				<p className="mb-8 text-sm text-suave">Nenhum curso cadastrado ainda.</p>
			) : (
				<div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{cursos.map((c) => (
						<Cartao key={c.id}>
							<div className="flex items-start justify-between gap-2">
								<p className="font-mono text-xs text-vermelho">{c.codigo}</p>
								<Chip tom={c.situacao === "ativo" ? "ok" : "neutro"}>{situacoesCurso[c.situacao]}</Chip>
							</div>
							<p className="font-serif text-lg font-bold">{c.nome}</p>
							<p className="mt-1 text-sm text-suave">
								{niveis[c.nivel]} · {modalidades[c.modalidade]}
							</p>
							<p className="text-sm text-suave">
								{c.carga} h · {c.duracao} semestres · {c.turnos.map((t) => turnos[t]).join(", ") || "sem turno"}
							</p>
							<p className="mt-3 text-sm">{c.alunos} alunos · {c.turmas} turmas</p>
							<Link href={`/cursos/${c.id}`} className="mt-3 inline-block text-sm text-vermelho hover:underline">
								Disciplinas e ofertas
							</Link>
						</Cartao>
					))}
				</div>
			)}

			<Cartao titulo="Turmas">
				{periodos.length === 0 ? (
					<p className="text-sm text-suave">Nenhum período letivo cadastrado ainda.</p>
				) : (
					<>
						<div className="mb-4 max-w-xs">
							<Campo
								label="Período letivo"
								value={periodoFiltro}
								onChange={setPeriodoFiltro}
								opcoes={periodos.map((p) => p.codigo)}
							/>
						</div>
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase text-suave">
									<th className="pb-2">Turma</th><th className="pb-2">Curso</th><th className="pb-2">Turno</th>
									<th className="pb-2">Vagas</th><th className="pb-2">Professores</th>
								</tr>
							</thead>
							<tbody>
								{turmasDoPeriodo.length === 0 && (
									<tr className="border-t border-linha">
										<td colSpan={5} className="py-3 text-suave">Nenhuma turma neste período.</td>
									</tr>
								)}
								{turmasDoPeriodo.map((t) => (
									<tr key={t.id} className="border-t border-linha">
										<td className="py-2 font-mono text-xs">{t.codigo}</td>
										<td className="py-2">{t.curso}</td>
										<td className="py-2">{turnos[t.turno]}</td>
										<td className="py-2">{t.matriculados}/{t.vagas}</td>
										<td className="py-2">{t.professores || "—"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</>
				)}
			</Cartao>

			<Modal aberto={modal === "curso"} titulo="Novo curso" onFechar={() => setModal(null)}>
				<form onSubmit={enviarCurso} className="space-y-4">
					<Campo label="Nome do curso" value={curso.nome} onChange={(v) => setCurso({ ...curso, nome: v })} />
					<div className="grid grid-cols-2 gap-4">
						<Campo label="Código" value={curso.codigo} onChange={(v) => setCurso({ ...curso, codigo: v })} placeholder="INF" />
						<Campo label="Situação" value={curso.situacao} opcoes={rotulosDe(situacoesCurso)} onChange={(v) => setCurso({ ...curso, situacao: v })} />
						<Campo label="Nível" value={curso.nivel} opcoes={rotulosDe(niveis)} onChange={(v) => setCurso({ ...curso, nivel: v })} />
						<Campo label="Modalidade" value={curso.modalidade} opcoes={rotulosDe(modalidades)} onChange={(v) => setCurso({ ...curso, modalidade: v })} />
						<Campo label="Carga horária (h)" type="number" value={curso.carga} onChange={(v) => setCurso({ ...curso, carga: v })} />
						<Campo label="Duração (semestres)" type="number" value={curso.duracao} onChange={(v) => setCurso({ ...curso, duracao: v })} />
						<Campo label="Vagas por turma (opcional)" type="number" value={curso.vagas} onChange={(v) => setCurso({ ...curso, vagas: v })} />
					</div>
					<div>
						<p className="mb-1 text-sm font-medium">Turnos oferecidos</p>
						<div className="flex gap-4 text-sm">
							{Object.entries(turnos).map(([codigo, rotulo]) => (
								<label key={codigo} className="flex items-center gap-2">
									<input type="checkbox" checked={curso.turnos.includes(codigo)} onChange={() => alternarTurno(codigo)} />
									{rotulo}
								</label>
							))}
						</div>
					</div>
					{erro && <p className="text-sm text-vermelho">{erro}</p>}
					<div className="flex justify-end gap-2">
						<button type="button" className={classeBotao("claro")} onClick={() => setModal(null)}>Cancelar</button>
						<button
							type="submit"
							className={classeBotao("primario")}
							disabled={ocupado || !curso.nome || !curso.codigo || !curso.carga || !curso.duracao || curso.turnos.length === 0}
						>
							{ocupado ? "Salvando..." : "Salvar curso"}
						</button>
					</div>
				</form>
			</Modal>

			<Modal aberto={modal === "periodo"} titulo="Novo período letivo" onFechar={() => setModal(null)}>
				<form onSubmit={enviarPeriodo} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<Campo label="Ano" type="number" value={periodoNovo.ano} onChange={(v) => setPeriodoNovo({ ...periodoNovo, ano: v })} />
						<Campo label="Semestre" value={periodoNovo.semestre} opcoes={["1", "2"]} onChange={(v) => setPeriodoNovo({ ...periodoNovo, semestre: v })} />
						<Campo label="Início" type="date" value={periodoNovo.inicio} onChange={(v) => setPeriodoNovo({ ...periodoNovo, inicio: v })} />
						<Campo label="Fim" type="date" value={periodoNovo.fim} onChange={(v) => setPeriodoNovo({ ...periodoNovo, fim: v })} />
					</div>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={periodoNovo.atual} onChange={(e) => setPeriodoNovo({ ...periodoNovo, atual: e.target.checked })} />
						Marcar como período atual
					</label>
					{erro && <p className="text-sm text-vermelho">{erro}</p>}
					<div className="flex justify-end gap-2">
						<button type="button" className={classeBotao("claro")} onClick={() => setModal(null)}>Cancelar</button>
						<button
							type="submit"
							className={classeBotao("primario")}
							disabled={ocupado || !periodoNovo.ano || !periodoNovo.inicio || !periodoNovo.fim}
						>
							{ocupado ? "Salvando..." : "Salvar período"}
						</button>
					</div>
				</form>
			</Modal>

			<Modal aberto={modal === "turma"} titulo="Nova turma" onFechar={() => setModal(null)}>
				<form onSubmit={enviarTurma} className="space-y-4">
					<Campo label="Curso" value={turma.curso} opcoes={cursos.map((c) => c.nome)} onChange={escolherCurso} />
					<div className="grid grid-cols-2 gap-4">
						<Campo label="Período letivo" value={turma.periodo} opcoes={periodos.map((p) => p.codigo)} onChange={(v) => setTurma({ ...turma, periodo: v })} />
						<Campo label="Turno" value={turma.turno} opcoes={turnosDaTurma} onChange={(v) => setTurma({ ...turma, turno: v })} />
						<Campo label="Período do curso" type="number" value={turma.periodoCurso} onChange={(v) => setTurma({ ...turma, periodoCurso: v })} />
						<Campo label="Letra da turma" value={turma.letra} onChange={(v) => setTurma({ ...turma, letra: v })} placeholder="A" />
						<Campo label="Vagas" type="number" value={turma.vagas} onChange={(v) => setTurma({ ...turma, vagas: v })} />
					</div>
					{erro && <p className="text-sm text-vermelho">{erro}</p>}
					<div className="flex justify-end gap-2">
						<button type="button" className={classeBotao("claro")} onClick={() => setModal(null)}>Cancelar</button>
						<button
							type="submit"
							className={classeBotao("primario")}
							disabled={ocupado || !turma.curso || !turma.periodo || !turma.turno || !turma.letra || !turma.vagas}
						>
							{ocupado ? "Salvando..." : "Salvar turma"}
						</button>
					</div>
				</form>
			</Modal>
		</>
	);
}