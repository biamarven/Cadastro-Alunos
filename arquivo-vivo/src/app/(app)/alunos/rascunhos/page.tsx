import Link from "next/link";
import { Cartao, Titulo, classeBotao } from "@/components/ui";
import { sql } from "@/lib/db";
import { lerSessao } from "@/lib/sessao";
import { descartarRascunho } from "./actions";

export const dynamic = "force-dynamic";

export default async function RascunhosPage() {
	const sessao = await lerSessao();

	await sql`
		delete from cadastro_rascunho
		where 1=1
		and atualizado_em < now() - make_interval(days => coalesce((select descarte_rascunho_dias from configuracao limit 1), 30)::int)
	`;

	const lista = sessao
		? await sql`
			select
				id::text as id,
				nome_aluno,
				etapa_atual,
				total_etapas,
				dados ->> 'curso' as curso,
				to_char(atualizado_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as salvo_em
			from cadastro_rascunho
			where 1=1
			and criado_por = ${String(sessao.usuarioId)}::bigint
			order by atualizado_em desc
		`
		: [];

	return (
		<>
			<Titulo titulo="Rascunhos de cadastro" sub="Cadastros iniciados e não concluídos. Rascunhos são descartados após 30 dias.">
				<Link href="/alunos" className={classeBotao("claro")}>Voltar para alunos</Link>
			</Titulo>
			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Aluno</th><th className="pb-2">Curso</th><th className="pb-2">Etapa</th>
							<th className="pb-2">Salvo em</th><th className="pb-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map((r) => (
							<tr key={String(r.id)} className="border-t border-linha">
								<td className="py-2 font-medium">{r.nome_aluno || "(sem nome)"}</td>
								<td className="py-2">{r.curso || "—"}</td>
								<td className="py-2">Etapa {Number(r.etapa_atual)} de {Number(r.total_etapas)}</td>
								<td className="py-2">{String(r.salvo_em)}</td>
								<td className="py-2 text-right">
									<span className="inline-flex items-center gap-3">
										<Link href={`/alunos/novo?rascunho=${r.id}`} className="text-vermelho hover:underline">Retomar</Link>
										<form action={descartarRascunho.bind(null, String(r.id))}>
											<button type="submit" className="text-suave hover:text-vermelho">Descartar</button>
										</form>
									</span>
								</td>
							</tr>
						))}
						{lista.length === 0 && (
							<tr><td colSpan={5} className="py-8 text-center text-suave">Nenhum rascunho salvo.</td></tr>
						)}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}