export type Permissoes = Record<string, string>;

const regras: { teste: (caminho: string) => boolean; modulo: string }[] = [
	{ teste: (c) => c.startsWith("/alunos/novo"), modulo: "Cadastro de alunos" },
	{ teste: (c) => c.startsWith("/alunos/rascunhos"), modulo: "Cadastro de alunos" },
	{ teste: (c) => /^\/alunos\/[^/]+\/editar/.test(c), modulo: "Cadastro de alunos" },
	{ teste: (c) => /^\/alunos\/[^/]+\/historico/.test(c), modulo: "Histórico acadêmico" },
	{ teste: (c) => c.startsWith("/alunos"), modulo: "Alunos" },
	{ teste: (c) => c.startsWith("/cursos"), modulo: "Cursos e turmas" },
	{ teste: (c) => c.startsWith("/notas"), modulo: "Notas" },
	{ teste: (c) => c.startsWith("/administracao"), modulo: "Administração" },
];

export function moduloDaRota(caminho: string): string | null {
	const regra = regras.find((r) => r.teste(caminho));
	return regra ? regra.modulo : null;
}

export function podeAcessar(permissoes: Permissoes, modulo: string): boolean {
	const nivel = permissoes[modulo];
	return nivel === "ver" || nivel === "editar";
}