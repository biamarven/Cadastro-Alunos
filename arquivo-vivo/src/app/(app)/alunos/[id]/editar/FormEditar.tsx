"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import type { Aluno } from "@/lib/mock";

export default function FormEditar({ aluno }: { aluno: Aluno }) {
	const router = useRouter();
	const [f, setF] = useState({
		nome: aluno.nome, email: aluno.email, telefone: aluno.telefone, cidade: aluno.cidade, situacao: aluno.situacao,
	});

	function salvar(e: FormEvent) {
		e.preventDefault();
		router.push(`/alunos/${aluno.id}`); // ligar à API depois
	}

	return (
		<form onSubmit={salvar} className="space-y-6">
			<Cartao titulo="Dados editáveis">
				<div className="grid gap-4 md:grid-cols-2">
					<Campo className="md:col-span-2" label="Nome completo" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} />
					<Campo label="E-mail" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
					<Campo label="Telefone" value={f.telefone} onChange={(v) => setF({ ...f, telefone: v })} />
					<Campo label="Cidade" value={f.cidade} onChange={(v) => setF({ ...f, cidade: v })} />
					<Campo label="Situação da matrícula" value={f.situacao} opcoes={["Ativa", "Trancada", "Concluída"]}
						onChange={(v) => setF({ ...f, situacao: v as Aluno["situacao"] })} />
				</div>
			</Cartao>
			<Cartao titulo="Dados bloqueados">
				<div className="grid gap-4 md:grid-cols-3">
					<Campo label="Matrícula" value={aluno.matricula} readOnly />
					<Campo label="CPF" value={aluno.cpf} readOnly />
					<Campo label="Curso" value={aluno.curso} readOnly />
				</div>
			</Cartao>
			<div className="flex justify-end gap-2">
				<button type="button" className={classeBotao("claro")} onClick={() => router.back()}>Cancelar</button>
				<button type="submit" className={classeBotao("primario")}>Salvar alterações</button>
			</div>
		</form>
	);
}