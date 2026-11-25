"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import { removerResponsavel, salvarResponsavel } from "./actions";

type Responsavel = {
	id: string;
	nome: string;
	cpf: string;
	nascimento: string;
	telefone: string;
	email: string;
	parentesco: string;
	financeiro: boolean;
};

const PARENTESCOS: Record<string, string> = {
	mae: "Mãe",
	pai: "Pai",
	avo: "Avô/Avó",
	tio: "Tio/Tia",
	irmao: "Irmão/Irmã",
	tutor_legal: "Tutor legal",
	outro: "Outro",
};

function chaveDe(mapa: Record<string, string>, rotulo: string) {
	return Object.keys(mapa).find((k) => mapa[k] === rotulo) ?? "";
}

function LinhaResponsavel({
	alunoId,
	r,
	podeRemover,
}: {
	alunoId: string;
	r: Responsavel;
	podeRemover: boolean;
}) {
	const router = useRouter();
	const [pendente, iniciar] = useTransition();
	const [erro, setErro] = useState("");
	const [salvo, setSalvo] = useState(false);
	const [f, setF] = useState({
		nome: r.nome,
		nascimento: r.nascimento,
		telefone: r.telefone,
		email: r.email,
		parentesco: PARENTESCOS[r.parentesco] ?? "Outro",
		financeiro: r.financeiro ? "Sim" : "Não",
	});

	function salvar() {
		setErro("");
		setSalvo(false);
		iniciar(async () => {
			const x = await salvarResponsavel(alunoId, r.id, {
				nome: f.nome,
				nascimento: f.nascimento,
				telefone: f.telefone,
				email: f.email,
				parentesco: chaveDe(PARENTESCOS, f.parentesco),
				financeiro: f.financeiro === "Sim",
			});
			if (x.erro) {
				setErro(x.erro);
				return;
			}
			setSalvo(true);
			router.refresh();
		});
	}

	function remover() {
		if (!window.confirm(`Remover ${r.nome} deste aluno?`)) return;
		setErro("");
		iniciar(async () => {
			const x = await removerResponsavel(alunoId, r.id);
			if (x.erro) {
				setErro(x.erro);
				return;
			}
			router.refresh();
		});
	}

	return (
		<Cartao titulo={`Responsável: ${r.nome}`}>
			<div className="grid gap-4 md:grid-cols-2">
				<Campo className="md:col-span-2" label="Nome completo" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} />
				<Campo label="CPF" value={r.cpf} readOnly />
				<Campo label="Data de nascimento" type="date" value={f.nascimento} onChange={(v) => setF({ ...f, nascimento: v })} />
				<Campo label="Telefone" value={f.telefone} onChange={(v) => setF({ ...f, telefone: v })} />
				<Campo label="E-mail" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
				<Campo
					label="Parentesco"
					value={f.parentesco}
					opcoes={Object.values(PARENTESCOS)}
					onChange={(v) => setF({ ...f, parentesco: v })}
				/>
				<Campo
					label="Responsável financeiro"
					value={f.financeiro}
					opcoes={["Sim", "Não"]}
					onChange={(v) => setF({ ...f, financeiro: v })}
				/>
			</div>
			{erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
			{salvo && !erro && <p className="mt-3 text-sm text-green-700">Responsável salvo.</p>}
			<div className="mt-4 flex justify-end gap-2">
				<button type="button" onClick={remover} disabled={pendente || !podeRemover} className={classeBotao("claro")}>
					Remover vínculo
				</button>
				<button type="button" onClick={salvar} disabled={pendente} className={classeBotao("primario")}>
					{pendente ? "Salvando..." : "Salvar responsável"}
				</button>
			</div>
			{!podeRemover && (
				<p className="mt-2 text-right text-xs text-gray-500">
					Aluno menor de 18 anos precisa de ao menos um responsável.
				</p>
			)}
		</Cartao>
	);
}

export default function ResponsaveisEdicao({
	alunoId,
	menor,
	responsaveis,
}: {
	alunoId: string;
	menor: boolean;
	responsaveis: Responsavel[];
}) {
	if (responsaveis.length === 0) {
		return (
			<div className="mt-6">
				<Cartao titulo="Responsáveis">
					<p className="text-sm text-gray-600">Nenhum responsável vinculado a este aluno.</p>
				</Cartao>
			</div>
		);
	}

	return (
		<div className="mt-6 space-y-6">
			{responsaveis.map((r) => (
				<LinhaResponsavel
					key={r.id}
					alunoId={alunoId}
					r={r}
					podeRemover={!(menor && responsaveis.length <= 1)}
				/>
			))}
		</div>
	);
}