import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { permissaoAtual } from "@/lib/autorizacao";
import { alunoNoEscopo } from "@/lib/escopoAlunos";
import { Cartao, Chip, Titulo, classeBotao, iniciais, tomSituacao } from "@/components/ui";
import { formatarCpf, mascararCpf } from "@/lib/formatos";
import { parentescos, situacoesMatricula, turnos } from "@/lib/rotulos";

export const dynamic = "force-dynamic";

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!/^\d+$/.test(id)) {
		notFound();
	}

	const acesso = await permissaoAtual("Alunos");
	if (acesso.nivel !== "ver" && acesso.nivel !== "editar") {
		notFound();
	}

	const usuarioId = String(acesso.sessao?.usuarioId ?? "0");
	if (!(await alunoNoEscopo(id, String(acesso.escopo), usuarioId))) {
		notFound();
	}

	const alunos = await sql`
		select
			aluno.id,
			aluno.nome_completo as nome,
			aluno.cpf,
			to_char(aluno.data_nascimento, 'DD/MM/YYYY') as nascimento,
			aluno.email,
			aluno.telefone,
			aluno.cidade,
			aluno.uf
		from aluno
		where 1=1
		and aluno.id = ${id}
	`;

	if (alunos.length === 0) {
		notFound();
	}

	const aluno = alunos[0];

	const matriculas = await sql`
		select
			matricula.id,
			matricula.numero,
			matricula.situacao,
			matricula.turno,
			curso.nome as curso,
			(
				select turma.codigo
				from matricula_turma
				join turma on (
					turma.id = matricula_turma.turma_id
				)
				join periodo_letivo on (
					periodo_letivo.id = matricula_turma.periodo_letivo_id
				)
				where 1=1
				and matricula_turma.matricula_id = matricula.id
				order by periodo_letivo.ano desc, periodo_letivo.semestre desc
				limit 1
			) as turma
		from matricula
		join curso on (
			curso.id = matricula.curso_id
		)
		where 1=1
		and matricula.aluno_id = ${id}
		order by (matricula.situacao = 'ativa') desc, matricula.criado_em desc
	`;

	const responsaveis = await sql`
		select
			responsavel.id,
			responsavel.nome_completo as nome,
			responsavel.cpf,
			responsavel.telefone,
			aluno_responsavel.parentesco,
			aluno_responsavel.responsavel_financeiro
		from aluno_responsavel
		join responsavel on (
			responsavel.id = aluno_responsavel.responsavel_id
		)
		where 1=1
		and aluno_responsavel.aluno_id = ${id}
		order by responsavel.nome_completo
	`;

	const cadastro = await permissaoAtual("Cadastro de alunos");
	const historico = await permissaoAtual("Histórico acadêmico");
	const verCpf = cadastro.nivel !== "sem_acesso";
	const cpfDe = (cpf: string) => (verCpf ? formatarCpf(cpf) : mascararCpf(cpf));

	const principal = matriculas[0];
	const situacaoPrincipal = principal ? situacoesMatricula[principal.situacao] : "Sem matrícula";

	const dados: [string, string][] = [
		["CPF", cpfDe(aluno.cpf)],
		["Nascimento", aluno.nascimento],
		["E-mail", aluno.email],
		["Telefone", aluno.telefone ?? "—"],
		["Cidade", aluno.cidade ? `${aluno.cidade}/${aluno.uf}` : "—"],
	];

	return (
		<>
			<Titulo titulo={aluno.nome} sub="Perfil do aluno">
				{historico.nivel !== "sem_acesso" && (
					<Link href={`/alunos/${aluno.id}/historico`} className={classeBotao("claro")}>Emitir histórico</Link>
				)}
				{cadastro.nivel === "editar" && (
					<Link href={`/alunos/${aluno.id}/editar`} className={classeBotao("primario")}>Editar</Link>
				)}
			</Titulo>

			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				<Cartao className="text-center">
					<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-lateral font-serif text-4xl font-bold text-white">
						{iniciais(aluno.nome)}
					</div>
					{/* Número da matrícula: ano.semestre-sequência (ex.: 2024.1-0412) */}
					<p className="mt-3 font-mono text-sm">{principal ? principal.numero : "—"}</p>
					<div className="mt-2"><Chip tom={tomSituacao(situacaoPrincipal)}>{situacaoPrincipal}</Chip></div>
				</Cartao>

				<div className="space-y-6">
					<Cartao titulo="Dados pessoais">
						<dl className="grid gap-3 text-sm md:grid-cols-2">
							{dados.map(([k, v]) => (
								<div key={k}><dt className="text-xs uppercase text-suave">{k}</dt><dd className="font-medium">{v}</dd></div>
							))}
						</dl>
					</Cartao>

					<Cartao titulo={matriculas.length > 1 ? "Matrículas" : "Matrícula"}>
						{matriculas.length === 0 && <p className="text-sm text-suave">Este aluno ainda não tem matrícula.</p>}
						<div className="space-y-4">
							{matriculas.map((m) => (
								<dl key={m.id} className="grid gap-3 text-sm md:grid-cols-5">
									<div><dt className="text-xs uppercase text-suave">Curso</dt><dd className="font-medium">{m.curso}</dd></div>
									<div><dt className="text-xs uppercase text-suave">Turma</dt><dd className="font-medium">{m.turma ?? "—"}</dd></div>
									<div><dt className="text-xs uppercase text-suave">Número</dt><dd className="font-mono">{m.numero}</dd></div>
									<div><dt className="text-xs uppercase text-suave">Turno</dt><dd className="font-medium">{turnos[m.turno]}</dd></div>
									<div><dt className="text-xs uppercase text-suave">Situação</dt><dd className="font-medium">{situacoesMatricula[m.situacao]}</dd></div>
								</dl>
							))}
						</div>
					</Cartao>

					{responsaveis.map((r) => (
						<Cartao key={r.id} titulo="Responsável legal">
							<dl className="grid gap-3 text-sm md:grid-cols-2">
								<div><dt className="text-xs uppercase text-suave">Nome</dt><dd className="font-medium">{r.nome}</dd></div>
								<div><dt className="text-xs uppercase text-suave">Parentesco</dt><dd className="font-medium">{parentescos[r.parentesco]}</dd></div>
								<div><dt className="text-xs uppercase text-suave">Telefone</dt><dd className="font-medium">{r.telefone}</dd></div>
								<div><dt className="text-xs uppercase text-suave">CPF</dt><dd className="font-medium">{cpfDe(r.cpf)}</dd></div>
							</dl>
						</Cartao>
					))}
				</div>
			</div>
		</>
	);
}