import { lerSessao } from "@/lib/sessao";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const sessao = await lerSessao();
	return (
		<div className="flex min-h-screen">
			<Sidebar
				nome={sessao?.nome ?? ""}
				perfil={sessao?.perfil ?? ""}
				permissoes={sessao?.permissoes ?? {}}
			/>
			<main className="min-w-0 flex-1 p-8">{children}</main>
		</div>
	);
}