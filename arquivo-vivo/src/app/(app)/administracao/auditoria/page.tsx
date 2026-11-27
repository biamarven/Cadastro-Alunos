import Link from "next/link";
import { notFound } from "next/navigation";
import { Cartao, Titulo, classeBotao } from "@/components/ui";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";

export const dynamic = "force-dynamic";

const selecao = "mt-1 block rounded-md border border-linha bg-white px-2 py-1.5 text-sm normal-case outline-none focus:border-vermelho";

export default async function AuditoriaPage({
	searchParams,
}: {
	searchParams: Promise<{ entidade?: string; acao?: string }>;
}) {
	const filtros = await searchParams;
	const entidade = (filtros.entidade ?? "").slice(0, 60);
	const acao = (filtros.acao ?? "").slice(0, 40);

	const acesso = await permissaoAtual("Administração");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") notFound();

	const entidades = await sql`
		select distinct entidade
		from log_auditoria
		order by entidade
	`;
	const acoes = await sql`
		select distinct acao
		from log_auditoria
		order by acao
	`;

	const eventos = await sql`
		select
			log_auditoria.id::text as id,
			to_char(log_auditoria.criado_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as quando,
			coalesce(usuario.nome, 'Sistema') as quem,
			log_auditoria.acao,
			log_auditoria.entidade,
			log_auditoria.entidade_id::text as entidade_id
		from log_auditoria
		left join usuario on (
			usuario.id = log_auditoria.usuario_id
		)
		where 1=1
		and (${entidade}::text = '' or log_auditoria.entidade = ${entidade}::text)
		and (${acao}::text = '' or log_auditoria.acao = ${acao}::text)
		order by log_auditoria.id desc
		limit 200
	`;

	const ids = eventos.map((e) => String(e.id));
	const campos =
		ids.length > 0
			? await sql`
				select
					log_auditoria_id::text as log_id,
					campo,
					valor_anterior,
					valor_novo
				from log_auditoria_campo
				where 1=1
				and log_auditoria_id = any(${ids}::bigint[])
				order by id
			`
			: [];

	const camposPorEvento = new Map<string, { campo: string; anterior: string | null; novo: string | null }[]>();
	for (const c of campos) {
		const lista = camposPorEvento.get(String(c.log_id)) ?? [];
		lista.push({
			campo: String(c.campo),
			anterior: c.valor_anterior === null ? null : String(c.valor_anterior),
			novo: c.valor_novo === null ? null : String(c.valor_novo),
		});
		camposPorEvento.set(String(c.log_id), lista);
	}

	return (
		<>
			<Titulo titulo="Auditoria" sub="Registro de ações no sistema (últimos 200 eventos)">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
			</Titulo>

			<Cartao className="mb-4">
				<form action="/administracao/auditoria" method="get" className="flex flex-wrap items-end gap-3">
					<label className="text-xs font-semibold uppercase text-suave">
						Entidade
						<select name="entidade" defaultValue={entidade} className={selecao}>
							<option value="">Todas</option>
							{entidades.map((e) => (
								<option key={String(e.entidade)} value={String(e.entidade)}>{String(e.entidade)}</option>
							))}
						</select>
					</label>
					<label className="text-xs font-semibold uppercase text-suave">
						Ação
						<select name="acao" defaultValue={acao} className={selecao}>
							<option value="">Todas</option>
							{acoes.map((a) => (
								<option key={String(a.acao)} value={String(a.acao)}>{String(a.acao)}</option>
							))}
						</select>
					</label>
					<button type="submit" className={classeBotao("primario")}>Filtrar</button>
					<Link href="/administracao/auditoria" className={classeBotao("claro")}>Limpar</Link>
				</form>
			</Cartao>

			<Cartao>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase text-suave">
							<th className="pb-2">Quando</th>
							<th className="pb-2">Quem</th>
							<th className="pb-2">Ação</th>
							<th className="pb-2">Alvo</th>
							<th className="pb-2">Alterações</th>
						</tr>
					</thead>
					<tbody>
						{eventos.map((e) => (
							<tr key={String(e.id)} className="border-t border-linha align-top">
								<td className="py-2 font-mono text-xs">{String(e.quando)}</td>
								<td className="py-2">{String(e.quem)}</td>
								<td className="py-2">{String(e.acao)}</td>
								<td className="py-2">
									{String(e.entidade)}
									{e.entidade_id !== null && <span className="text-suave"> #{String(e.entidade_id)}</span>}
								</td>
								<td className="py-2 text-xs">
									{(camposPorEvento.get(String(e.id)) ?? []).map((c) => (
										<p key={c.campo} className="break-words">
											<span className="font-semibold">{c.campo}:</span>{" "}
											{c.anterior === null ? (c.novo ?? "—") : `${c.anterior} → ${c.novo ?? "—"}`}
										</p>
									))}
								</td>
							</tr>
						))}
						{eventos.length === 0 && (
							<tr>
								<td colSpan={5} className="py-6 text-center text-suave">Nenhum evento encontrado.</td>
							</tr>
						)}
					</tbody>
				</table>
			</Cartao>
		</>
	);
}