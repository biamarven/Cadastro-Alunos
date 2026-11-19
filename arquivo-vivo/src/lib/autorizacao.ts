import { sql } from "@/lib/db";
import { lerSessao } from "@/lib/sessao";

export async function exigirEdicao(modulo: string) {
	const sessao = await lerSessao();

	if (!sessao) {
		throw new Error("Sem sessão");
	}

	const linhas = await sql`
		select perfil_permissao.nivel
		from usuario
		join perfil_permissao on (
			perfil_permissao.perfil_id = usuario.perfil_id
		)
		join modulo on (
			modulo.id = perfil_permissao.modulo_id
		)
		where 1=1
		and usuario.id = ${sessao.usuarioId}
		and usuario.situacao = 'ativo'
		and modulo.nome = ${modulo}
	`;

	if (linhas[0]?.nivel !== "editar") {
		throw new Error("Sem permissão");
	}

	return sessao;
}