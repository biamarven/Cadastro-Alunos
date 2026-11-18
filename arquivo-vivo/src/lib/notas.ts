export type ResultadoNota = {
	media: number | null;
	situacao: "Em andamento" | "Aprovado" | "Recuperação" | "Reprovado";
};

// Pesos padrão 30/30/40. Corte: >= 7,0 aprovado; 5,0 a 6,9 recuperação; < 5,0 reprovado.
export function converter(valor: string): number | null {
	const n = parseFloat(valor.replace(",", "."));
	if (Number.isNaN(n) || n < 0 || n > 10) return null;
	return n;
}

export function calcular(n1: string, n2: string, n3: string): ResultadoNota {
	const a = converter(n1);
	const b = converter(n2);
	const c = converter(n3);
	if (a === null || b === null || c === null) return { media: null, situacao: "Em andamento" };
	const media = Math.round((a * 0.3 + b * 0.3 + c * 0.4 + 1e-9) * 10) / 10;
	if (media >= 7) return { media, situacao: "Aprovado" };
	if (media >= 5) return { media, situacao: "Recuperação" };
	return { media, situacao: "Reprovado" };
}

export function idade(nascimento: string): number | null {
	if (!nascimento) return null;
	const d = new Date(nascimento);
	const h = new Date();
	let i = h.getFullYear() - d.getFullYear();
	const m = h.getMonth() - d.getMonth();
	if (m < 0 || (m === 0 && h.getDate() < d.getDate())) i--;
	return i;
}