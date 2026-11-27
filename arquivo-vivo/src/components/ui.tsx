import type { ReactNode } from "react";
import OrigemDebug from "@/components/OrigemDebug";

export const classeBotao = (v: "primario" | "claro" | "perigo" = "primario") =>
	"inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 " +
	(v === "primario"
		? "bg-vermelho text-white hover:bg-vinho"
		: v === "perigo"
			? "border border-vermelho text-vermelho hover:bg-vermelho/10"
			: "border border-linha bg-cartao text-tinta hover:bg-white");

export const iniciais = (nome: string) =>
	nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export function Titulo({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
	return (
		<header className="mb-6 flex flex-wrap items-end justify-between gap-3">
			<div>
				<h1 className="font-serif text-3xl font-bold">{titulo}</h1>
				{sub && <p className="mt-1 text-sm text-suave">{sub}</p>}
			</div>
			<div className="flex flex-wrap gap-2">{children}</div>
		</header>
	);
}

export function Cartao({ titulo, children, className = "" }: { titulo?: string; children: ReactNode; className?: string }) {
	return (
		<section className={`rounded-lg border border-linha bg-cartao p-5 ${className}`}>
			{titulo && <h2 className="mb-4 font-serif text-lg font-bold">{titulo}</h2>}
			{children}
		</section>
	);
}

const tons = {
	ok: "bg-emerald-100 text-emerald-800",
	alerta: "bg-amber-100 text-amber-800",
	erro: "bg-red-100 text-vinho",
	neutro: "bg-stone-200 text-stone-700",
};

export function Chip({ tom = "neutro", children }: { tom?: keyof typeof tons; children: ReactNode }) {
	return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tons[tom]}`}>{children}</span>;
}

export function tomSituacao(s: string): keyof typeof tons {
	if (s === "Aprovado" || s === "Ativa") return "ok";
	if (s === "Recuperação" || s === "Trancada" || s === "Em andamento") return "alerta";
	if (s === "Reprovado") return "erro";
	return "neutro";
}

type CampoProps = {
	label: string;
	value: string;
	onChange?: (v: string) => void;
	type?: string;
	opcoes?: string[];
	placeholder?: string;
	readOnly?: boolean;
	className?: string;
	dica?: string;
	origem?: string | false;
};

export function Campo({ label, value, onChange, type = "text", opcoes, placeholder, readOnly, className = "", dica, origem }: CampoProps) {
	const base =
		"w-full rounded-md border border-linha bg-white px-3 py-2 text-sm outline-none focus:border-vermelho read-only:bg-stone-100";
	return (
		<label className={`block ${className}`}>
			<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-suave">
				{label}
				<OrigemDebug label={label} origem={origem} />
			</span>
			{opcoes ? (
				<select className={base} value={value} disabled={readOnly} onChange={(e) => onChange?.(e.target.value)}>
					<option value="">Selecione…</option>
					{Array.from(new Set(opcoes)).map((o) => (
						<option key={o} value={o}>{o}</option>
					))}
				</select>
			) : (
				<input
					className={base}
					type={type}
					value={value}
					placeholder={placeholder}
					readOnly={readOnly}
					onChange={(e) => onChange?.(e.target.value)}
				/>
			)}
			{dica && <span className="mt-1 block text-xs text-suave">{dica}</span>}
		</label>
	);
}