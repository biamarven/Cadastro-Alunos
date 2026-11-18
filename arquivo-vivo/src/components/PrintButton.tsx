"use client";

import { classeBotao } from "@/components/ui";

export default function PrintButton() {
	return (
		<button className={classeBotao("primario") + " no-print"} onClick={() => window.print()}>
			Imprimir / salvar PDF
		</button>
	);
}