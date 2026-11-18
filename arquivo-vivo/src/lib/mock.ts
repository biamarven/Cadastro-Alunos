export type Aluno = {
	id: string;
	nome: string;
	matricula: string;
	curso: string;
	turma: string;
	situacao: "Ativa" | "Trancada" | "Concluída";
	nascimento: string;
	cpf: string;
	email: string;
	telefone: string;
	cidade: string;
	responsavel?: { nome: string; parentesco: string; telefone: string; cpf: string };
};

export const alunos: Aluno[] = [
	{
		id: "1", nome: "Marina Souza Lima", matricula: "2024.1-0412", curso: "Técnico em Informática",
		turma: "INF-1A", situacao: "Ativa", nascimento: "2008-03-14", cpf: "***.***.***-42",
		email: "marina.lima@email.com", telefone: "(48) 99911-2233", cidade: "Palhoça/SC",
		responsavel: { nome: "Carla Souza Lima", parentesco: "Mãe", telefone: "(48) 99922-1100", cpf: "***.***.***-10" },
	},
	{
		id: "2", nome: "Rafael Pereira Costa", matricula: "2023.2-0388", curso: "Técnico em Administração",
		turma: "ADM-2B", situacao: "Ativa", nascimento: "2001-07-02", cpf: "***.***.***-55",
		email: "rafael.costa@email.com", telefone: "(48) 99888-4455", cidade: "São José/SC",
	},
	{
		id: "3", nome: "Beatriz Almeida Nunes", matricula: "2024.1-0420", curso: "Técnico em Informática",
		turma: "INF-1A", situacao: "Ativa", nascimento: "2007-11-23", cpf: "***.***.***-71",
		email: "bia.nunes@email.com", telefone: "(48) 99777-8899", cidade: "Florianópolis/SC",
		responsavel: { nome: "Paulo Nunes", parentesco: "Pai", telefone: "(48) 99766-1234", cpf: "***.***.***-20" },
	},
	{
		id: "4", nome: "Lucas Henrique Martins", matricula: "2022.1-0201", curso: "Técnico em Enfermagem",
		turma: "ENF-3A", situacao: "Trancada", nascimento: "1999-01-30", cpf: "***.***.***-08",
		email: "lucas.martins@email.com", telefone: "(48) 99655-3322", cidade: "Palhoça/SC",
	},
	{
		id: "5", nome: "Juliana Ferreira Rocha", matricula: "2021.2-0150", curso: "Técnico em Administração",
		turma: "ADM-4A", situacao: "Concluída", nascimento: "1998-05-18", cpf: "***.***.***-33",
		email: "ju.rocha@email.com", telefone: "(48) 99544-7766", cidade: "Biguaçu/SC",
	},
	{
		id: "6", nome: "Pedro Augusto Silva", matricula: "2024.2-0455", curso: "Técnico em Enfermagem",
		turma: "ENF-1A", situacao: "Ativa", nascimento: "2002-09-09", cpf: "***.***.***-64",
		email: "pedro.silva@email.com", telefone: "(48) 99433-1100", cidade: "Santo Amaro/SC",
	},
];

export type Curso = {
	id: string; nome: string; codigo: string; carga: number;
	duracao: string; turnos: string[]; alunos: number; turmas: number;
};

export const cursos: Curso[] = [
	{ id: "1", nome: "Técnico em Informática", codigo: "INF", carga: 1200, duracao: "4 semestres", turnos: ["Manhã", "Noite"], alunos: 412, turmas: 12 },
	{ id: "2", nome: "Técnico em Administração", codigo: "ADM", carga: 1000, duracao: "4 semestres", turnos: ["Tarde", "Noite"], alunos: 356, turmas: 10 },
	{ id: "3", nome: "Técnico em Enfermagem", codigo: "ENF", carga: 1800, duracao: "6 semestres", turnos: ["Manhã"], alunos: 480, turmas: 14 },
];

export const turmas = [
	{ codigo: "INF-1A", curso: "Técnico em Informática", periodo: "2026.2", turno: "Manhã", vagas: 40, matriculados: 38, professor: "Ana Beatriz Lopes" },
	{ codigo: "INF-2B", curso: "Técnico em Informática", periodo: "2026.2", turno: "Noite", vagas: 40, matriculados: 31, professor: "Carlos Mendes" },
	{ codigo: "ADM-2B", curso: "Técnico em Administração", periodo: "2026.2", turno: "Tarde", vagas: 35, matriculados: 35, professor: "Fernanda Dias" },
	{ codigo: "ENF-1A", curso: "Técnico em Enfermagem", periodo: "2026.2", turno: "Manhã", vagas: 30, matriculados: 27, professor: "Marcos Vieira" },
	{ codigo: "INF-1A", curso: "Técnico em Informática", periodo: "2026.1", turno: "Manhã", vagas: 40, matriculados: 40, professor: "Ana Beatriz Lopes" },
];

export const historico = [
	{
		periodo: "2024.1",
		disciplinas: [
			{ nome: "Lógica de Programação", media: 8.4, situacao: "Aprovado" },
			{ nome: "Matemática Aplicada", media: 6.2, situacao: "Recuperação" },
			{ nome: "Inglês Instrumental", media: 9.1, situacao: "Aprovado" },
		],
	},
	{
		periodo: "2024.2",
		disciplinas: [
			{ nome: "Banco de Dados", media: 7.8, situacao: "Aprovado" },
			{ nome: "Redes de Computadores", media: 7.0, situacao: "Aprovado" },
			{ nome: "Matemática Aplicada (recuperação)", media: 7.1, situacao: "Aprovado" },
		],
	},
];

export const notasTurma = [
	{ id: "1", nome: "Marina Souza Lima", matricula: "2024.1-0412", n1: "8.5", n2: "7.0", n3: "" },
	{ id: "3", nome: "Beatriz Almeida Nunes", matricula: "2024.1-0420", n1: "9.0", n2: "8.5", n3: "9.5" },
	{ id: "7", nome: "Diego Santos Prado", matricula: "2024.1-0431", n1: "4.0", n2: "5.5", n3: "" },
	{ id: "8", nome: "Camila Rezende", matricula: "2024.1-0433", n1: "", n2: "", n3: "" },
	{ id: "9", nome: "Thiago Barbosa", matricula: "2024.1-0440", n1: "6.0", n2: "6.5", n3: "7.0" },
];

export const perfis = ["Administrador", "Secretaria", "Coordenação", "Professor"];

export const modulos = [
	{ id: "alunos", nome: "Alunos" },
	{ id: "cadastro_alunos", nome: "Cadastro de alunos" },
	{ id: "cursos_turmas", nome: "Cursos e turmas" },
	{ id: "notas", nome: "Notas" },
	{ id: "historico", nome: "Histórico" },
	{ id: "administracao", nome: "Administração" },
];

export type Permissao = {
	nivel: "Sem acesso" | "Ver" | "Editar";
	escopo: "Todos" | "Curso" | "Turmas";
	justificativa: boolean;
};

const p = (nivel: Permissao["nivel"], escopo: Permissao["escopo"] = "Todos", justificativa = false): Permissao => ({
	nivel, escopo, justificativa,
});

// Matriz de exemplo para a tela. Ajuste para ficar igual ao 02_dados_iniciais.sql.
export const matrizInicial: Record<string, Record<string, Permissao>> = {
	Administrador: {
		alunos: p("Editar"), cadastro_alunos: p("Editar"), cursos_turmas: p("Editar"),
		notas: p("Editar", "Todos", true), historico: p("Editar"), administracao: p("Editar"),
	},
	Secretaria: {
		alunos: p("Editar"), cadastro_alunos: p("Editar"), cursos_turmas: p("Ver"),
		notas: p("Editar", "Todos", true), historico: p("Editar"), administracao: p("Sem acesso"),
	},
	"Coordenação": {
		alunos: p("Ver", "Curso"), cadastro_alunos: p("Ver", "Curso"), cursos_turmas: p("Editar", "Curso"),
		notas: p("Editar", "Curso", true), historico: p("Ver", "Curso"), administracao: p("Sem acesso"),
	},
	Professor: {
		alunos: p("Ver", "Turmas"), cadastro_alunos: p("Sem acesso"), cursos_turmas: p("Ver", "Turmas"),
		notas: p("Editar", "Turmas", true), historico: p("Sem acesso"), administracao: p("Sem acesso"),
	},
};

export const usuarios = [
	{ id: "1", nome: "Gabriel Souza", email: "gabriel@arquivovivo.edu.br", perfil: "Administrador", ativo: true },
	{ id: "2", nome: "Beatriz Marques", email: "beatriz@arquivovivo.edu.br", perfil: "Secretaria", ativo: true },
	{ id: "3", nome: "Ana Beatriz Lopes", email: "ana.lopes@arquivovivo.edu.br", perfil: "Professor", ativo: true },
	{ id: "4", nome: "Carlos Mendes", email: "carlos.mendes@arquivovivo.edu.br", perfil: "Coordenação", ativo: false },
];

export const auditoria = [
	{ quando: "18/11/2026 10:42", quem: "Beatriz Marques", acao: "Criou aluno", alvo: "Pedro Augusto Silva (2024.2-0455)" },
	{ quando: "18/11/2026 09:15", quem: "Ana Beatriz Lopes", acao: "Lançou nota N2", alvo: "INF-1A · Lógica de Programação" },
	{ quando: "17/11/2026 16:30", quem: "Gabriel Souza", acao: "Alterou permissão", alvo: "Perfil Coordenação · Notas" },
	{ quando: "17/11/2026 14:02", quem: "Beatriz Marques", acao: "Corrigiu nota (justificada)", alvo: "Diego Santos Prado · N1" },
];