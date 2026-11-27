"use client";

import { usePathname } from "next/navigation";
import { origemDoCampo } from "@/lib/debugCampos";

export default function OrigemDebug({ label, origem }: { label: string; origem?: string | false }) {
	const caminho = usePathname();
	if (origem === false) return null;
	const texto = origem ?? origemDoCampo(caminho, label);
	if (!texto) return null;
	return (
		<span className="debug-origem hidden ml-2 rounded bg-amber-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold normal-case tracking-normal text-amber-900 [html[data-debug=on]_&]:inline-block">
			{texto}
		</span>
	);
}