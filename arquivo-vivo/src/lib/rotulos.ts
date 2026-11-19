export const niveis: Record<string, string> = {
	graduacao: "Graduação",
	tecnico: "Técnico",
	pos_graduacao: "Pós-graduação",
};

export const modalidades: Record<string, string> = {
	presencial: "Presencial",
	ead: "EAD",
	hibrido: "Híbrido",
};

export const turnos: Record<string, string> = {
	manha: "Manhã",
	tarde: "Tarde",
	noite: "Noite",
};

export const situacoesCurso: Record<string, string> = {
	ativo: "Ativo",
	em_implantacao: "Em implantação",
	inativo: "Inativo",
};

export function rotulosDe(mapa: Record<string, string>) {
	return Object.values(mapa);
}

export function codigoDe(mapa: Record<string, string>, rotulo: string) {
	return Object.keys(mapa).find((chave) => mapa[chave] === rotulo) ?? "";
}

export const situacoesMatricula: Record<string, string> = {
	ativa: "Ativa",
	trancada: "Trancada",
	inativa: "Inativa",
};

export const parentescos: Record<string, string> = {
	mae: "Mãe",
	pai: "Pai",
	avo: "Avô/Avó",
	tio: "Tio/Tia",
	irmao: "Irmão/Irmã",
	tutor_legal: "Tutor legal",
	outro: "Outro",
};