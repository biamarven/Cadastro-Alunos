import { sql } from "@/lib/db";
import UsuariosCliente from "./UsuariosCliente";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
	const usuarios = await sql`
		select
			usuario.id,
			usuario.nome,
			usuario.email,
			perfil.nome as perfil,
			usuario.situacao,
			(usuario.senha_hash is null) as pendente
		from usuario
		join perfil on (
			perfil.id = usuario.perfil_id
		)
		where 1=1
		order by usuario.nome
	`;

	const perfis = await sql`
		select nome
		from perfil
		where 1=1
		order by nome
	`;

	return (
		<UsuariosCliente
			usuarios={usuarios.map((u) => ({
				id: String(u.id),
				nome: u.nome,
				email: u.email,
				perfil: u.perfil,
				ativo: u.situacao === "ativo",
				pendente: Boolean(u.pendente),
			}))}
			perfis={perfis.map((p) => p.nome)}
		/>
	);
}