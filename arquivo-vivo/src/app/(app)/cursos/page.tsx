"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/Modal";
import { Campo, Cartao, Titulo, classeBotao } from "@/components/ui";
import { cursos as inicial, turmas } from "@/lib/mock";

const vazio = { nome: "", codigo: "", carga: "", duracao: "", turno: "" };

export default function CursosPage() {
	const [lista, setLista] = useState(inicial);
	const [aberto, setAberto] = useState(false);
	const [f, setF] = useState(vazio);
	const [periodo, setPeriodo] = useState("2026.2");

	function salvar(e: FormEvent) {
		e.preventDefault();
		setLista([
			...lista,
			{ id: String(lista.length + 1), nome: f.nome, codigo: f.codigo.toUpperCase(), carga: Number(f.carga),
				duracao: f.duracao, turnos: f.turno ? [f.turno] : [], alunos: 0, turmas: 0 },
		]);
		setF(vazio);
		setAberto(false);
	}

	return (
		<>
			<Titulo titulo="Cursos e turmas" sub="Cursos oferecidos e turmas do período">
				<button className={classeBotao("primario")} onClick={() => setAberto(true)}>+ Novo curso</button>
			</Titulo>

			<div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{lista.map((c) => (
					<Cartao key={c.id}>
						<p className="font-mono text-xs text-vermelho">{c.codigo}</p>
						<p className="font-serif text-lg font-bold">{c.nome}</p>
						<p className="mt-1 text-sm text-suave">{c.carga} h · {c.duracao} · {c.turnos.join(", ") || "sem turno"}</p>
						<p className="mt-3 text-sm">{c.alunos} alunos · {c.turmas} turmas</p>
					</Cartao>
				))}
			</div>

			<Cartao titulo="Turmas">
				<div className="mb-4 max-w-xs">
					<Campo label="Período letivo" value={periodo} onChange={setPeriodo} opcoes={["2026.1", "2026.2"]} />
				</div>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Turma</th><th className="pb-2">Curso</th><th className="pb-2">Turno</th>
							<th className="pb-2">Vagas</th><th className="pb-2">Professor</th>
						</tr>
					</thead>
					<tbody>
						{turmas.filter((t) => !periodo || t.periodo === periodo).map((t) => (
							<tr key={t.codigo + t.periodo} className="border-t border-linha">
								<td className="py-2 font-mono text-xs">{t.codigo}</td>
								<td className="py-2">{t.curso}</td>
								<td className="py-2">{t.turno}</td>
								<td className="py-2">{t.matriculados}/{t.vagas}</td>
								<td className="py-2">{t.professor}</td>
							</tr>
						))}
					</tbody>
				</table>
			</Cartao>

			<Modal aberto={aberto} titulo="Novo curso" onFechar={() => setAberto(false)}>
				<form onSubmit={salvar} className="space-y-4">
					<Campo label="Nome do curso" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} />
					<div className="grid grid-cols-2 gap-4">
						<Campo label="Código" value={f.codigo} onChange={(v) => setF({ ...f, codigo: v })} placeholder="INF" />
						<Campo label="Carga horária (h)" type="number" value={f.carga} onChange={(v) => setF({ ...f, carga: v })} />
						<Campo label="Duração" value={f.duracao} onChange={(v) => setF({ ...f, duracao: v })} placeholder="4 semestres" />
						<Campo label="Turno" value={f.turno} onChange={(v) => setF({ ...f, turno: v })} opcoes={["Manhã", "Tarde", "Noite"]} />
					</div>
					<div className="flex justify-end gap-2">
						<button type="button" className={classeBotao("claro")} onClick={() => setAberto(false)}>Cancelar</button>
						<button type="submit" className={classeBotao("primario")} disabled={!f.nome || !f.codigo || !f.carga}>Salvar curso</button>
					</div>
				</form>
			</Modal>
		</>
	);
}