"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import { trocarSenha } from "./actions";

export default function FormSenha() {
	const [atual, setAtual] = useState("");
	const [nova, setNova] = useState("");
	const [confirmacao, setConfirmacao] = useState("");
	const [erro, setErro] = useState("");
	const [ok, setOk] = useState(false);
	const [ocupado, iniciar] = useTransition();

	function enviar(e: FormEvent) {
		e.preventDefault();
		setErro("");
		setOk(false);
		iniciar(async () => {
			const r = await trocarSenha(atual, nova, confirmacao);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			setAtual("");
			setNova("");
			setConfirmacao("");
			setOk(true);
		});
	}

	return (
		<Cartao>
			<form onSubmit={enviar} className="max-w-md space-y-4">
				<Campo label="Senha atual" type="password" value={atual} onChange={setAtual} />
				<Campo label="Nova senha (mínimo 8 caracteres)" type="password" value={nova} onChange={setNova} />
				<Campo label="Confirmar nova senha" type="password" value={confirmacao} onChange={setConfirmacao} />
				{erro && <p className="text-sm text-vermelho">{erro}</p>}
				{ok && <p className="text-sm text-suave">Senha alterada com sucesso.</p>}
				<div className="flex justify-end">
					<button
						type="submit"
						className={classeBotao("primario")}
						disabled={ocupado || !atual || !nova || !confirmacao}
					>
						{ocupado ? "Salvando..." : "Trocar senha"}
					</button>
				</div>
			</form>
		</Cartao>
	);
}