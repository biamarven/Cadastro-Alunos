"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Campo, classeBotao } from "@/components/ui";
import { aceitarConvite } from "./actions";

export default function ConvitePage() {
	const { token } = useParams<{ token: string }>();
	const router = useRouter();
	const [senha, setSenha] = useState("");
	const [confirmar, setConfirmar] = useState("");
	const [erro, setErro] = useState("");
	const [enviando, iniciar] = useTransition();

	function enviar(e: FormEvent) {
		e.preventDefault();
		if (senha.length < 8) {
			setErro("A senha precisa ter ao menos 8 caracteres.");
			return;
		}
		if (senha !== confirmar) {
			setErro("As senhas não são iguais.");
			return;
		}
		setErro("");
		iniciar(async () => {
			const resultado = await aceitarConvite(token, senha);
			if (resultado.erro) {
				setErro(resultado.erro);
				return;
			}
			router.push("/login");
		});
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<form onSubmit={enviar} className="w-full max-w-sm space-y-4">
				<div className="font-serif text-2xl font-bold">
					Arquivo <span className="text-vermelho">Vivo</span>
				</div>
				<h1 className="font-serif text-3xl font-bold">Defina sua senha</h1>
				<p className="text-sm text-suave">Escolha uma senha com pelo menos 8 caracteres para acessar o sistema.</p>
				<Campo label="Nova senha" type="password" value={senha} onChange={setSenha} />
				<Campo label="Repita a senha" type="password" value={confirmar} onChange={setConfirmar} />
				{erro && <p className="text-sm text-vermelho">{erro}</p>}
				<button type="submit" disabled={enviando} className={classeBotao("primario") + " w-full"}>
					{enviando ? "Salvando..." : "Salvar e entrar"}
				</button>
			</form>
		</div>
	);
}