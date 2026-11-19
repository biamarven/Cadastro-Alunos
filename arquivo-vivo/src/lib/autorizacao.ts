import { sql } from "@/lib/db";
import { lerSessao } from "@/lib/sessao";

export async function permissaoAtual(modulo: string) {
	const sessao = await lerSessao();

	if (!sessao) {
		return { sessao: null, nivel: "sem_acesso", escopo: "todos" };
	}

	const linhas = await sql`
		select
			perfil_permissao.nivel,
			perfil_permissao.escopo
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

	return {
		sessao,
		nivel: String(linhas[0]?.nivel ?? "sem_acesso"),
		escopo: String(linhas[0]?.escopo ?? "todos"),
	};
}

export async function exigirEdicao(modulo: string, exigirTodos = false) {
	const permissao = await permissaoAtual(modulo);

	if (!permissao.sessao || permissao.nivel !== "editar") {
		throw new Error("Sem permissão");
	}

	if (exigirTodos && permissao.escopo !== "todos") {
		throw new Error("Sem permissão");
	}

	return permissao.sessao;
}