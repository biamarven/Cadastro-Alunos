"use client";

import Link from "next/link";
import { useState } from "react";
import { Campo, Cartao, Chip, Titulo, classeBotao } from "@/components/ui";

export default function InstituicaoPage() {
	const [inst, setInst] = useState({ nome: "Instituto Arquivo Vivo", cnpj: "", cidade: "Palhoça/SC", email: "" });
	const [regra, setRegra] = useState({ n1: "30", n2: "30", n3: "40", aprovacao: "7,0", recuperacao: "5,0" });
	const [salvo, setSalvo] = useState(false);

	const soma = Number(regra.n1) + Number(regra.n2) + Number(regra.n3);

	return (
		<>
			<Titulo titulo="Instituição e regras" sub="Dados da instituição, regra de notas e períodos">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
				<button className={classeBotao("primario")} disabled={soma !== 100} onClick={() => setSalvo(true)}>Salvar</button>
			</Titulo>

			<div className="space-y-6">
				<Cartao titulo="Dados da instituição">
					<div className="grid gap-4 md:grid-cols-2">
						<Campo label="Nome" value={inst.nome} onChange={(v) => setInst({ ...inst, nome: v })} />
						<Campo label="CNPJ" value={inst.cnpj} onChange={(v) => setInst({ ...inst, cnpj: v })} />
						<Campo label="Cidade" value={inst.cidade} onChange={(v) => setInst({ ...inst, cidade: v })} />
						<Campo label="E-mail de contato" value={inst.email} onChange={(v) => setInst({ ...inst, email: v })} />
					</div>
				</Cartao>

				<Cartao titulo="Regra de notas">
					<div className="grid gap-4 md:grid-cols-5">
						<Campo label="Peso N1 (%)" value={regra.n1} onChange={(v) => setRegra({ ...regra, n1: v })} />
						<Campo label="Peso N2 (%)" value={regra.n2} onChange={(v) => setRegra({ ...regra, n2: v })} />
						<Campo label="Peso N3 (%)" value={regra.n3} onChange={(v) => setRegra({ ...regra, n3: v })} />
						<Campo label="Média p/ aprovar" value={regra.aprovacao} onChange={(v) => setRegra({ ...regra, aprovacao: v })} />
						<Campo label="Média p/ recuperação" value={regra.recuperacao} onChange={(v) => setRegra({ ...regra, recuperacao: v })} />
					</div>
					{soma !== 100 && <p className="mt-2 text-sm text-vermelho">Os pesos precisam somar 100 (agora: {soma}).</p>}
				</Cartao>

				<Cartao titulo="Períodos letivos">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase text-suave">
								<th className="pb-2">Período</th><th className="pb-2">Início</th><th className="pb-2">Fim</th><th className="pb-2">Status</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-t border-linha"><td className="py-2 font-mono">2026.2</td><td>03/08/2026</td><td>18/12/2026</td><td><Chip tom="ok">Atual</Chip></td></tr>
							<tr className="border-t border-linha"><td className="py-2 font-mono">2026.1</td><td>09/02/2026</td><td>10/07/2026</td><td><Chip>Encerrado</Chip></td></tr>
						</tbody>
					</table>
				</Cartao>

				{salvo && <p className="text-sm text-suave">Configurações salvas (simulação).</p>}
			</div>
		</>
	);
}