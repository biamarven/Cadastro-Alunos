"use client";

import type { ReactNode } from "react";

export default function Modal({
	aberto, titulo, onFechar, children,
}: { aberto: boolean; titulo: string; onFechar: () => void; children: ReactNode }) {
	if (!aberto) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onFechar}>
			<div
				className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-cartao p-6 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-serif text-xl font-bold">{titulo}</h2>
					<button onClick={onFechar} aria-label="Fechar" className="text-2xl leading-none text-suave">×</button>
				</div>
				{children}
			</div>
		</div>
	);
}