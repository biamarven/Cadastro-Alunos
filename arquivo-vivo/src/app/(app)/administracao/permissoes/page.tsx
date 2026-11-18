"use client";

import Link from "next/link";
import { useState } from "react";
import { Campo, Cartao, Titulo, classeBotao } from "@/components/ui";
import { matrizInicial, modulos, perfis } from "@/lib/mock";
import type { Permissao } from "@/lib/mock";

const selecao = "rounded-md border border-linha bg-white px-2 py-1 text-sm outline-none focus:border-vermelho";

export default function PermissoesPage() {
	const [perfil, setPerfil] = useState(perfis[0]);
	const [matriz, setMatriz] = useState(matrizInicial);
	const [salvo, setSalvo] = useState(false);

	function mudar(modulo: string, campo: keyof Permissao, valor: string | boolean) {
		setSalvo(false);
		const novo = { ...matriz[perfil][modulo], [campo]: valor } as Permissao;
		setMatriz({ ...matriz, [perfil]: { ...matriz[perfil], [modulo]: novo } });
	}

	return (
		<>
			<Titulo titulo="Permissões" sub="O que cada perfil pode fazer em cada módulo">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
				<button className={classeBotao("primario")} onClick={() => setSalvo(true)}>Salvar permissões</button>
			</Titulo>

			<Cartao className="mb-4">
				<div className="max-w-xs">
					<Campo label="Perfil" value={perfil} onChange={setPerfil} opcoes={perfis} />
				</div>
			</Cartao>

			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Módulo</th><th className="pb-2">Nível</th><th className="pb-2">Escopo</th>
							<th className="pb-2">Exige justificativa</th>
						</tr>
					</thead>
					<tbody>
						{modulos.map((m) => {
							const p = matriz[perfil][m.id];
							return (
								<tr key={m.id} className="border-t border-linha">
									<td className="py-2 font-medium">{m.nome}</td>
									<td className="py-2">
										<select className={selecao} value={p.nivel} onChange={(e) => mudar(m.id, "nivel", e.target.value)}>
											<option>Sem acesso</option><option>Ver</option><option>Editar</option>
										</select>
									</td>
									<td className="py-2">
										<select className={selecao} value={p.escopo} onChange={(e) => mudar(m.id, "escopo", e.target.value)}>
											<option>Todos</option><option>Curso</option><option>Turmas</option>
										</select>
									</td>
									<td className="py-2">
										<input type="checkbox" checked={p.justificativa} onChange={(e) => mudar(m.id, "justificativa", e.target.checked)} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{salvo && <p className="mt-3 text-sm text-suave">Permissões salvas (simulação).</p>}
			</Cartao>
		</>
	);
}