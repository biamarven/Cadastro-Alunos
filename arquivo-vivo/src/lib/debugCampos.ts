const MAPAS: Record<string, Record<string, string>> = {
	"/administracao/instituicao": {
		"razão social": "instituicao.razao_social",
		"nome fantasia": "instituicao.nome_fantasia",
		"sigla": "instituicao.sigla",
		"cnpj": "instituicao.cnpj",
		"credenciamento": "instituicao.credenciamento",
		"cep": "instituicao.cep",
		"logradouro": "instituicao.logradouro",
		"número": "instituicao.numero",
		"complemento": "instituicao.complemento",
		"bairro": "instituicao.bairro",
		"cidade": "instituicao.cidade",
		"uf": "instituicao.uf",
		"e-mail de contato": "instituicao.email",
		"telefone": "instituicao.telefone",
		"site": "instituicao.site",
		"peso n1": "configuracao_peso.peso (ordem 1)",
		"peso n2": "configuracao_peso.peso (ordem 2)",
		"peso n3": "configuracao_peso.peso (ordem 3)",
		"média p/ aprovar": "configuracao.nota_aprovacao",
		"média p/ recuperação": "configuracao.nota_recuperacao",
		"descartar rascunhos após": "configuracao.descarte_rascunho_dias",
	},
	"/cursos": {
		"nome do curso": "curso.nome",
		"código": "curso.codigo",
		"situação": "curso.situacao",
		"nível": "curso.nivel",
		"modalidade": "curso.modalidade",
		"carga horária": "curso.carga_horaria_total",
		"duração": "curso.duracao_semestres",
		"vagas por turma": "curso.vagas_por_turma",
		"ano": "periodo_letivo.ano",
		"semestre": "periodo_letivo.semestre",
		"início": "periodo_letivo.data_inicio",
		"fim": "periodo_letivo.data_fim",
		"curso": "turma.curso_id",
		"turno": "turma.turno",
		"período do curso": "turma.periodo_curso",
		"letra da turma": "turma.letra",
		"vagas": "turma.vagas",
	},
	"/conta/senha": {
		"senha atual": "usuario.senha_hash (só o hash é guardado)",
		"nova senha": "usuario.senha_hash (só o hash é guardado)",
		"confirmar nova senha": "não é gravada (só confere com a nova)",
	},
	"/alunos": {
		"data de nascimento": "aluno.data_nascimento",
		"nascimento": "aluno.data_nascimento",
		"cep": "aluno.cep",
		"logradouro": "aluno.logradouro",
		"número": "aluno.numero",
		"complemento": "aluno.complemento",
		"bairro": "aluno.bairro",
		"cidade": "aluno.cidade",
		"uf": "aluno.uf",
		"parentesco": "aluno_responsavel.parentesco",
	},
};

function normalizar(label: string) {
	return label.replace(/\(.*?\)/g, "").replace(/\*/g, "").trim().toLowerCase();
}

export function origemDoCampo(caminho: string, label: string): string | null {
	const prefixos = Object.keys(MAPAS)
		.filter((p) => caminho === p || caminho.startsWith(p + "/"))
		.sort((a, b) => b.length - a.length);
	if (prefixos.length === 0) return null;
	return MAPAS[prefixos[0]][normalizar(label)] ?? null;
}