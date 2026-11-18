import Link from "next/link";
import { Cartao, Titulo, classeBotao } from "@/components/ui";
import { auditoria } from "@/lib/mock";

export default function AuditoriaPage() {
	return (
		<>
			<Titulo titulo="Auditoria" sub="Registro de ações no sistema">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
			</Titulo>
			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Quando</th><th className="pb-2">Quem</th><th className="pb-2">Ação</th><th className="pb-2">Alvo</th>
						</tr>
					</thead>
					<tbody>
						{auditoria.map((l, i) => (
							<tr key={i} className="border-t border-linha">
								<td className="py-2 font-mono text-xs">{l.quando}</td>
								<td className="py-2">{l.quem}</td>
								<td className="py-2">{l.acao}</td>
								<td className="py-2">{l.alvo}</td>
							</tr>
						))}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}