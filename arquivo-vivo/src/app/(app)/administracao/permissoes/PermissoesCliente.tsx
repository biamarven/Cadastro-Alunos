"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Titulo, classeBotao } from "@/components/ui";
import { salvarPermissoes } from "./actions";

type Perfil = { id: string; nome: string };
type Modulo = { id: string; nome: string };
type Linha = { nivel: string; escopo: string; justificativa: boolean };

const selecao = "rounded-md border border-linha bg-white px-2 py-1 text-sm outline-none focus:border-vermelho disabled:opacity-50";

const PADRAO: Linha = { nivel: "sem_acesso", escopo: "todos", justificativa: false };

export default function PermissoesCliente({
	podeEditar,
	perfis,
	modulos,
	permissoes,
}: {
	podeEditar: boolean;
	perfis: Perfil[];
	modulos: Modulo[];
	permissoes: Record<string, Linha>;
}) {
	const router = useRouter();
	const [salvando, iniciar] = useTransition();
	const [perfilNome, setPerfilNome] = useState(perfis[0]?.nome ?? "");
	const [matriz, setMatriz] = useState(permissoes);
	const [erro, setErro] = useState("");
	const [salvo, setSalvo] = useState(false);

	const perfil = perfis.find((p) => p.nome === perfilNome) ?? perfis[0];

	function obter(moduloId: string): Linha {
		return matriz[`${perfil.id}:${moduloId}`] ?? PADRAO;
	}

	function mudar(moduloId: string, campo: keyof Linha, valor: string | boolean) {
		setSalvo(false);
		setErro("");
		const chave = `${perfil.id}:${moduloId}`;
		setMatriz((atual) => ({ ...atual, [chave]: { ...(atual[chave] ?? PADRAO), [campo]: valor } }));
	}

	function salvar() {
		setErro("");
		setSalvo(false);
		iniciar(async () => {
			const r = await salvarPermissoes(
				perfil.id,
				modulos.map((m) => ({ moduloId: m.id, ...obter(m.id) })),
			);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			setSalvo(true);
			router.refresh();
		});
	}

	if (!perfil) {
		return (
			<>
				<Titulo titulo="Permissões" sub="O que cada perfil pode fazer em cada módulo" />
				<Cartao><p className="text-sm text-suave">Nenhum perfil cadastrado.</p></Cartao>
			</>
		);
	}

	return (
		<>
			<Titulo titulo="Permissões" sub="O que cada perfil pode fazer em cada módulo">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
				{podeEditar && (
					<button className={classeBotao("primario")} disabled={salvando} onClick={salvar}>
						{salvando ? "Salvando..." : "Salvar permissões"}
					</button>
				)}
			</Titulo>

			<Cartao className="mb-4">
				<div className="max-w-xs">
					<Campo
						label="Perfil"
						value={perfil.nome}
						onChange={(v) => {
							setPerfilNome(v);
							setErro("");
							setSalvo(false);
						}}
						opcoes={perfis.map((p) => p.nome)}
					/>
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
							const p = obter(m.id);
							const travada = !podeEditar || (perfil.nome === "Administrador" && m.nome === "Administração");
							return (
								<tr key={m.id} className="border-t border-linha">
									<td className="py-2 font-medium">{m.nome}</td>
									<td className="py-2">
										<select className={selecao} disabled={travada} value={p.nivel} onChange={(e) => mudar(m.id, "nivel", e.target.value)}>
											<option value="sem_acesso">Sem acesso</option>
											<option value="ver">Ver</option>
											<option value="editar">Editar</option>
										</select>
									</td>
									<td className="py-2">
										<select className={selecao} disabled={travada} value={p.escopo} onChange={(e) => mudar(m.id, "escopo", e.target.value)}>
											<option value="todos">Todos</option>
											<option value="curso">Curso</option>
											<option value="turmas">Turmas</option>
										</select>
									</td>
									<td className="py-2">
										<input type="checkbox" disabled={travada} checked={p.justificativa} onChange={(e) => mudar(m.id, "justificativa", e.target.checked)} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{erro && <p className="mt-3 text-sm text-vermelho">{erro}</p>}
				{salvo && !erro && (
					<p className="mt-3 text-sm text-suave">
						Permissões salvas. Para quem já está logado, o acesso às telas muda no próximo login; as ações de gravação já usam a regra nova.
					</p>
				)}
			</Cartao>
		</>
	);
}