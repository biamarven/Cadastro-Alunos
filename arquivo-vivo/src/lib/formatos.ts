export function formatarCpf(cpf: string) {
	const digitos = cpf.replace(/\D/g, "");
	if (digitos.length !== 11) {
		return cpf;
	}
	return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function mascararCpf(cpf: string) {
	const digitos = cpf.replace(/\D/g, "");
	if (digitos.length !== 11) {
		return "—";
	}
	return `•••.•••.•••-${digitos.slice(9)}`;
}

export function cpfValido(cpf: string) {
	const digitos = cpf.replace(/\D/g, "");

	if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
		return false;
	}

	for (const tamanho of [9, 10]) {
		let soma = 0;
		for (let i = 0; i < tamanho; i++) {
			soma += Number(digitos[i]) * (tamanho + 1 - i);
		}
		const digito = ((soma * 10) % 11) % 10;
		if (digito !== Number(digitos[tamanho])) {
			return false;
		}
	}

	return true;
}

export function idadeEm(nascimento: string) {
	const [ano, mes, dia] = nascimento.split("-").map(Number);
	const hoje = new Date();
	let anos = hoje.getFullYear() - ano;
	const mesAtual = hoje.getMonth() + 1;
	if (mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia)) {
		anos--;
	}
	return anos;
}