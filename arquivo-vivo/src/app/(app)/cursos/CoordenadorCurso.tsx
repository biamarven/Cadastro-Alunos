"use client";

import { useState, useTransition } from "react";
import { definirCoordenador } from "./actions";

export type UsuarioOpcao = { id: string; nome: string };

export default function CoordenadorCurso({
	cursoId,
	coordenadorId,
	usuarios,
	podeEditar,
}: {
	cursoId: string;
	coordenadorId: string | null;
	usuarios: UsuarioOpcao[];
	podeEditar: boolean;
}) {
	const [ocupado, iniciar] = useTransition();
	const [erro, setErro] = useState("");

	const atual = usuarios.find((u) => u.id === coordenadorId)?.nome ?? "Não definido";

	if (!podeEditar) {
		return <p className="mt-1 text-sm text-suave">Coordenação: {atual}</p>;
	}

	function mudar(valor: string) {
		setErro("");
		iniciar(async () => {
			const r = await definirCoordenador(cursoId, valor);
			if (r.erro) setErro(r.erro);
		});
	}

	return (
		<div className="mt-3">
			<label className="block text-xs font-semibold uppercase text-suave">
				Coordenador
				<select
					className="mt-1 block w-full rounded-md border border-linha bg-white px-2 py-1.5 text-sm normal-case outline-none focus:border-vermelho disabled:opacity-50"
					value={coordenadorId ?? ""}
					disabled={ocupado}
					onChange={(e) => mudar(e.target.value)}
				>
					<option value="">Não definido</option>
					{usuarios.map((u) => (
						<option key={u.id} value={u.id}>{u.nome}</option>
					))}
				</select>
			</label>
			{erro && <p className="mt-1 text-xs text-vermelho">{erro}</p>}
		</div>
	);
}