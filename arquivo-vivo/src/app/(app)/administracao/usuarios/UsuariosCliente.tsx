"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/Modal";
import { Campo, Cartao, Chip, Titulo, classeBotao } from "@/components/ui";
import { gerarConvite, salvarUsuario } from "./actions";

export type UsuarioLinha = {
	id: string;
	nome: string;
	email: string;
	perfil: string;
	ativo: boolean;
	pendente: boolean;
};

const vazio: UsuarioLinha = { id: "", nome: "", email: "", perfil: "", ativo: true, pendente: false };

export default function UsuariosCliente({
	usuarios,
	perfis,
}: {
	usuarios: UsuarioLinha[];
	perfis: string[];
}) {
	const [editando, setEditando] = useState<UsuarioLinha | null>(null);
	const [erro, setErro] = useState("");
	const [convite, setConvite] = useState("");
	const [copiado, setCopiado] = useState(false);
	const [ocupado, iniciar] = useTransition();

	function mostrarConvite(caminho: string) {
		setCopiado(false);
		setConvite(window.location.origin + caminho);
	}

	function abrir(usuario: UsuarioLinha) {
		setErro("");
		setEditando(usuario);
	}

	function salvar(e: FormEvent) {
		e.preventDefault();
		if (!editando) return;
		setErro("");
		iniciar(async () => {
			const resultado = await salvarUsuario({
				id: editando.id,
				nome: editando.nome,
				email: editando.email,
				perfil: editando.perfil,
				ativo: editando.ativo,
			});
			if (resultado.erro) {
				setErro(resultado.erro);
				return;
			}
			setEditando(null);
			if (resultado.convite) {
				mostrarConvite(resultado.convite);
			}
		});
	}

	function novoLink(id: string) {
		iniciar(async () => {
			const resultado = await gerarConvite(id);
			if (resultado.convite) {
				mostrarConvite(resultado.convite);
			}
		});
	}

	async function copiar() {
		await navigator.clipboard.writeText(convite);
		setCopiado(true);
	}

	return (
		<>
			<Titulo titulo="Usuários" sub="Contas com acesso ao sistema">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
				<button className={classeBotao("primario")} onClick={() => abrir({ ...vazio })}>+ Novo usuário</button>
			</Titulo>

			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Nome</th><th className="pb-2">E-mail</th><th className="pb-2">Perfil</th>
							<th className="pb-2">Status</th><th className="pb-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{usuarios.map((u) => (
							<tr key={u.id} className="border-t border-linha">
								<td className="py-2 font-medium">{u.nome}</td>
								<td className="py-2">{u.email}</td>
								<td className="py-2">{u.perfil}</td>
								<td className="py-2">
									<Chip tom={u.ativo && !u.pendente ? "ok" : "neutro"}>
										{!u.ativo ? "Inativo" : u.pendente ? "Convite pendente" : "Ativo"}
									</Chip>
								</td>
								<td className="space-x-3 py-2 text-right">
									<button className="text-vermelho hover:underline" onClick={() => abrir(u)}>Editar</button>
									<button className="text-vermelho hover:underline" disabled={ocupado} onClick={() => novoLink(u.id)}>
										{u.pendente ? "Reenviar convite" : "Redefinir senha"}
									</button>
									<Link href="/administracao/permissoes" className="text-vermelho hover:underline">Permissões</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Cartao>

			<Modal aberto={!!editando} titulo={editando?.id ? "Editar usuário" : "Novo usuário"} onFechar={() => setEditando(null)}>
				{editando && (
					<form onSubmit={salvar} className="space-y-4">
						<Campo label="Nome completo" value={editando.nome} onChange={(v) => setEditando({ ...editando, nome: v })} />
						<Campo label="E-mail" type="email" value={editando.email} onChange={(v) => setEditando({ ...editando, email: v })} />
						<Campo label="Perfil" value={editando.perfil} opcoes={perfis} onChange={(v) => setEditando({ ...editando, perfil: v })} />
						{!editando.id && (
							<p className="text-xs text-suave">Será gerado um link de convite. A pessoa abre o link e define a própria senha.</p>
						)}
						<label className="flex items-center gap-2 text-sm">
							<input type="checkbox" checked={editando.ativo} onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })} />
							Usuário ativo
						</label>
						{erro && <p className="text-sm text-vermelho">{erro}</p>}
						<div className="flex justify-end gap-2">
							<button type="button" className={classeBotao("claro")} onClick={() => setEditando(null)}>Cancelar</button>
							<button type="submit" className={classeBotao("primario")} disabled={ocupado || !editando.nome || !editando.email || !editando.perfil}>
								{ocupado ? "Salvando..." : "Salvar"}
							</button>
						</div>
					</form>
				)}
			</Modal>

			<Modal aberto={!!convite} titulo="Link de acesso" onFechar={() => setConvite("")}>
				<div className="space-y-4">
					<p className="text-sm">
						Envie este link para a pessoa definir a senha. Ele vale por 7 dias e só funciona uma vez.
						Copie agora: depois de fechar esta janela ele não aparece de novo (só gerando outro).
					</p>
					<input
						readOnly
						value={convite}
						onFocus={(e) => e.target.select()}
						className="w-full rounded-md border border-linha bg-cartao px-3 py-2 text-xs"
					/>
					<div className="flex justify-end gap-2">
						<button type="button" className={classeBotao("claro")} onClick={() => setConvite("")}>Fechar</button>
						<button type="button" className={classeBotao("primario")} onClick={copiar}>
							{copiado ? "Copiado!" : "Copiar link"}
						</button>
					</div>
				</div>
			</Modal>
		</>
	);
}