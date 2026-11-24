"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import { atualizarAluno } from "./actions";

type AlunoEdicao = {
	id: string; nome: string; cpf: string; email: string; telefone: string;
	cep: string; logradouro: string; numero: string; complemento: string;
	bairro: string; cidade: string; uf: string;
};

export default function FormEditar({
	aluno,
	matriculas,
}: {
	aluno: AlunoEdicao;
	matriculas: { numero: string; curso: string }[];
}) {
	const router = useRouter();
	const [pendente, iniciar] = useTransition();
	const [erro, setErro] = useState("");
	const [f, setF] = useState({
		nome: aluno.nome, email: aluno.email, telefone: aluno.telefone,
		cep: aluno.cep, logradouro: aluno.logradouro, numero: aluno.numero,
		complemento: aluno.complemento, bairro: aluno.bairro, cidade: aluno.cidade, uf: aluno.uf,
	});

	function salvar(e: FormEvent) {
		e.preventDefault();
		setErro("");
		iniciar(async () => {
			const r = await atualizarAluno(aluno.id, f);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			router.push(`/alunos/${aluno.id}`);
			router.refresh();
		});
	}

	return (
		<form onSubmit={salvar} className="space-y-6">
			<Cartao titulo="Dados pessoais e contato">
				<div className="grid gap-4 md:grid-cols-2">
					<Campo className="md:col-span-2" label="Nome completo" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} />
					<Campo label="E-mail" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
					<Campo label="Telefone" value={f.telefone} onChange={(v) => setF({ ...f, telefone: v })} />
				</div>
			</Cartao>
			<Cartao titulo="Endereço">
				<div className="grid gap-4 md:grid-cols-3">
					<Campo label="CEP" value={f.cep} onChange={(v) => setF({ ...f, cep: v })} />
					<Campo className="md:col-span-2" label="Logradouro" value={f.logradouro} onChange={(v) => setF({ ...f, logradouro: v })} />
					<Campo label="Número" value={f.numero} onChange={(v) => setF({ ...f, numero: v })} />
					<Campo className="md:col-span-2" label="Complemento" value={f.complemento} onChange={(v) => setF({ ...f, complemento: v })} />
					<Campo label="Bairro" value={f.bairro} onChange={(v) => setF({ ...f, bairro: v })} />
					<Campo label="Cidade" value={f.cidade} onChange={(v) => setF({ ...f, cidade: v })} />
					<Campo label="UF" value={f.uf} onChange={(v) => setF({ ...f, uf: v.toUpperCase().slice(0, 2) })} />
				</div>
			</Cartao>
			<Cartao titulo="Dados bloqueados">
				<div className="grid gap-4 md:grid-cols-3">
					<Campo label="CPF" value={aluno.cpf} readOnly />
					{matriculas.map((m) => (
						<Campo key={m.numero} label="Matrícula" value={`${m.numero} · ${m.curso}`} readOnly />
					))}
				</div>
			</Cartao>
			{erro && <p className="text-sm text-red-600">{erro}</p>}
			<div className="flex justify-end gap-2">
				<button type="button" className={classeBotao("claro")} onClick={() => router.back()}>Cancelar</button>
				<button type="submit" disabled={pendente} className={classeBotao("primario")}>
					{pendente ? "Salvando..." : "Salvar alterações"}
				</button>
			</div>
		</form>
	);
}