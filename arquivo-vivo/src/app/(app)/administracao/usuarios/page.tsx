"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "@/components/Modal";
import { Campo, Cartao, Chip, Titulo, classeBotao } from "@/components/ui";
import { perfis, usuarios as inicial } from "@/lib/mock";

type Usuario = (typeof inicial)[number];
const vazio: Usuario = { id: "", nome: "", email: "", perfil: "", ativo: true };

export default function UsuariosPage() {
	const [lista, setLista] = useState(inicial);
	const [editando, setEditando] = useState<Usuario | null>(null);

	function salvar(e: FormEvent) {
		e.preventDefault();
		if (!editando) return;
		if (editando.id) {
			setLista(lista.map((u) => (u.id === editando.id ? editando : u)));
		} else {
			setLista([...lista, { ...editando, id: String(Date.now()) }]);
		}
		setEditando(null);
	}

	return (
		<>
			<Titulo titulo="Usuários" sub="Contas com acesso ao sistema">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
				<button className={classeBotao("primario")} onClick={() => setEditando({ ...vazio })}>+ Novo usuário</button>
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
						{lista.map((u) => (
							<tr key={u.id} className="border-t border-linha">
								<td className="py-2 font-medium">{u.nome}</td>
								<td className="py-2">{u.email}</td>
								<td className="py-2">{u.perfil}</td>
								<td className="py-2"><Chip tom={u.ativo ? "ok" : "neutro"}>{u.ativo ? "Ativo" : "Inativo"}</Chip></td>
								<td className="space-x-3 py-2 text-right">
									<button className="text-vermelho hover:underline" onClick={() => setEditando(u)}>Editar</button>
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
							<p className="text-xs text-suave">Uma senha temporária será enviada por e-mail; o usuário troca no primeiro acesso.</p>
						)}
						<label className="flex items-center gap-2 text-sm">
							<input type="checkbox" checked={editando.ativo} onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })} />
							Usuário ativo
						</label>
						<div className="flex justify-end gap-2">
							<button type="button" className={classeBotao("claro")} onClick={() => setEditando(null)}>Cancelar</button>
							<button type="submit" className={classeBotao("primario")} disabled={!editando.nome || !editando.email || !editando.perfil}>Salvar</button>
						</div>
					</form>
				)}
			</Modal>
		</>
	);
}