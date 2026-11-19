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