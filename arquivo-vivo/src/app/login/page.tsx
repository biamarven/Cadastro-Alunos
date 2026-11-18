"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Campo, classeBotao } from "@/components/ui";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [erro, setErro] = useState("");

	function entrar(e: FormEvent) {
		e.preventDefault();
		if (!email.includes("@") || senha.length < 6) {
			setErro("Informe um e-mail válido e uma senha com ao menos 6 caracteres.");
			return;
		}
		router.push("/inicio"); // trocar pela autenticação real depois
	}

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<section className="hidden flex-col justify-between bg-lateral p-12 text-stone-300 lg:flex">
				<div className="font-serif text-2xl font-bold text-white">
					Arquivo <span className="text-vermelho">Vivo</span>
				</div>
				<div>
					<h2 className="font-serif text-5xl font-bold leading-tight text-white">
						A memória acadêmica,<br />sempre à mão.
					</h2>
					<p className="mt-4 max-w-md text-stone-400">
						Cadastro de alunos, turmas, notas e históricos do Instituto Arquivo Vivo em um só lugar.
					</p>
				</div>
				<p className="text-xs text-stone-500">© Instituto Arquivo Vivo</p>
			</section>

			<section className="flex items-center justify-center p-8">
				<form onSubmit={entrar} className="w-full max-w-sm space-y-4">
					<h1 className="font-serif text-3xl font-bold">Entrar</h1>
					<p className="text-sm text-suave">Use o e-mail institucional cadastrado pela secretaria.</p>
					<Campo label="E-mail" type="email" value={email} onChange={setEmail} placeholder="nome@arquivovivo.edu.br" />
					<Campo label="Senha" type="password" value={senha} onChange={setSenha} />
					{erro && <p className="text-sm text-vermelho">{erro}</p>}
					<button type="submit" className={classeBotao("primario") + " w-full"}>Entrar</button>
					<p className="text-center text-xs text-suave">Esqueceu a senha? Procure a secretaria.</p>
				</form>
			</section>
		</div>
	);
}