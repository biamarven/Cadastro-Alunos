"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Titulo, classeBotao } from "@/components/ui";
import { idade } from "@/lib/notas";
import { codigoDe, formasIngresso, parentescos, rotulosDe, turnos } from "@/lib/rotulos";
import { cadastrarAluno } from "./actions";
import { carregarRascunho, descartarRascunho, salvarRascunho as gravarRascunho } from "../rascunhos/actions";

export type TurmaOpcao = {
	id: string;
	codigo: string;
	curso: string;
	periodo: string;
	turno: string;
	vagasLivres: number;
};

const vazio = {
	nome: "", nascimento: "", cpf: "",
	email: "", telefone: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "SC",
	curso: "", turma: "", periodo: "", forma_ingresso: "",
	resp_nome: "", resp_parentesco: "", resp_cpf: "", resp_nascimento: "", resp_telefone: "", resp_email: "",
};
type Form = typeof vazio;

const obrigatorios: Record<string, (keyof Form)[]> = {
	pessoais: ["nome", "nascimento", "cpf"],
	contato: ["email", "telefone", "cidade"],
	curso: ["curso", "turma", "periodo", "forma_ingresso"],
	docs: [],
	resp: ["resp_nome", "resp_parentesco", "resp_cpf", "resp_nascimento", "resp_telefone", "resp_email"],
	revisao: [],
};

const nomesPassos: Record<string, string> = {
	pessoais: "Dados pessoais", contato: "Contato e endereço", curso: "Curso e turma",
	docs: "Documentos", resp: "Responsável legal", revisao: "Revisão",
};

export default function NovoAlunoCliente({
	cursos,
	periodos,
	turmas,
}: {
	cursos: string[];
	periodos: { codigo: string; atual: boolean }[];
	turmas: TurmaOpcao[];
}) {
	const router = useRouter();
	const padrao = periodos.find((p) => p.atual)?.codigo ?? periodos[0]?.codigo ?? "";
	const [form, setForm] = useState<Form>({ ...vazio, periodo: padrao });
	const [passo, setPasso] = useState(0);
	const [concluido, setConcluido] = useState<{ matricula: string; alunoId: string } | null>(null);
	const [erro, setErro] = useState("");
	const [enviando, iniciar] = useTransition();
	const idRascunho = useRef<string | null>(null);

	const menor = (idade(form.nascimento) ?? 99) < 18;
	const chaves = ["pessoais", "contato", "curso", "docs", ...(menor ? ["resp"] : []), "revisao"];
	const atual = chaves[Math.min(passo, chaves.length - 1)];
	const faltando = obrigatorios[atual].some((k) => !String(form[k] ?? "").trim());

	function set(k: keyof Form) {
		return (v: string) => setForm((f) => ({ ...f, [k]: v }));
	}

	// Retomar rascunho: /alunos/novo?rascunho=ID
	useEffect(() => {
		const id = new URLSearchParams(window.location.search).get("rascunho");
		if (!id) return;
		carregarRascunho(id).then((r) => {
			if (r.erro || !r.form) {
				setErro(r.erro ?? "Rascunho não encontrado.");
				return;
			}
			idRascunho.current = r.id ?? id;
			setForm({ ...vazio, ...r.form, periodo: r.form.periodo || padrao });
			setPasso(r.passo ?? 0);
		});
	}, [padrao]);

	function guardarRascunho() {
		setErro("");
		iniciar(async () => {
			const r = await gravarRascunho(idRascunho.current, form, passo, chaves.length - 1);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			router.push("/alunos/rascunhos");
		});
	}

	const turmasDisponiveis = turmas.filter(
		(t) => t.curso === form.curso && t.periodo === form.periodo && t.vagasLivres > 0,
	);
	const rotuloDaTurma = (t: TurmaOpcao) => `${t.codigo} · ${turnos[t.turno]} · ${t.vagasLivres} vaga(s)`;
	const turmaEscolhida = turmasDisponiveis.find((t) => rotuloDaTurma(t) === form.turma);

	function finalizar() {
		setErro("");
		if (!turmaEscolhida) {
			setErro("Escolha uma turma válida na etapa de curso e turma.");
			return;
		}
		iniciar(async () => {
			const resultado = await cadastrarAluno({
				nome: form.nome,
				nascimento: form.nascimento,
				cpf: form.cpf,
				email: form.email,
				telefone: form.telefone,
				cep: form.cep,
				rua: form.rua,
				numero: form.numero,
				bairro: form.bairro,
				cidade: form.cidade,
				uf: form.uf,
				turmaId: turmaEscolhida.id,
				formaIngresso: codigoDe(formasIngresso, form.forma_ingresso),
				responsavel: menor
					? {
							nome: form.resp_nome,
							parentesco: codigoDe(parentescos, form.resp_parentesco),
							cpf: form.resp_cpf,
							nascimento: form.resp_nascimento,
							telefone: form.resp_telefone,
							email: form.resp_email,
						}
					: null,
			});
			if (resultado.erro || !resultado.matricula || !resultado.alunoId) {
				setErro(resultado.erro ?? "Não foi possível concluir o cadastro.");
				return;
			}
			if (idRascunho.current) await descartarRascunho(idRascunho.current);
			setConcluido({ matricula: resultado.matricula, alunoId: resultado.alunoId });
		});
	}

	if (concluido) {
		return (
			<>
				<Titulo titulo="Aluno cadastrado" />
				<Cartao>
					<p className="mb-2">O cadastro de <strong>{form.nome}</strong> foi concluído.</p>
					<p className="mb-4 text-sm text-suave">
						Matrícula gerada: <span className="font-mono">{concluido.matricula}</span>
					</p>
					<div className="flex flex-wrap gap-2">
						<Link href={`/alunos/${concluido.alunoId}`} className={classeBotao("primario")}>Ver ficha do aluno</Link>
						<Link href="/alunos" className={classeBotao("claro")}>Ir para a lista de alunos</Link>
						<a href="/alunos/novo" className={classeBotao("claro")}>Cadastrar outro aluno</a>
					</div>
				</Cartao>
			</>
		);
	}

	return (
		<>
			<Titulo titulo="Novo aluno" sub="Preencha as etapas. Você pode salvar como rascunho e continuar depois." />

			<ol className="mb-6 flex flex-wrap gap-2">
				{chaves.map((c, i) => (
					<li
						key={c}
						className={`rounded-full px-3 py-1 text-xs font-semibold ${
							i === passo ? "bg-vermelho text-white" : i < passo ? "bg-tinta text-white" : "bg-stone-200 text-suave"
						}`}
					>
						{i + 1}. {nomesPassos[c]}
					</li>
				))}
			</ol>

			<Cartao titulo={nomesPassos[atual]}>
				{atual === "pessoais" && (
					<div className="grid gap-4 md:grid-cols-2">
						<Campo className="md:col-span-2" label="Nome completo *" value={form.nome} onChange={set("nome")} />
						<Campo label="Data de nascimento *" type="date" value={form.nascimento} onChange={set("nascimento")}
							dica={menor && form.nascimento ? "Aluno menor de 18 anos: será exigida a etapa de responsável legal." : undefined} />
						<Campo label="CPF *" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
					</div>
				)}

				{atual === "contato" && (
					<div className="grid gap-4 md:grid-cols-2">
						<Campo label="E-mail *" type="email" value={form.email} onChange={set("email")} />
						<Campo label="Telefone *" value={form.telefone} onChange={set("telefone")} placeholder="(48) 90000-0000" />
						<Campo label="CEP" value={form.cep} onChange={set("cep")} />
						<Campo label="Rua" value={form.rua} onChange={set("rua")} />
						<Campo label="Número" value={form.numero} onChange={set("numero")} />
						<Campo label="Bairro" value={form.bairro} onChange={set("bairro")} />
						<Campo label="Cidade *" value={form.cidade} onChange={set("cidade")} />
						<Campo label="UF" value={form.uf} onChange={set("uf")} />
					</div>
				)}

				{atual === "curso" && (
					<div className="grid gap-4 md:grid-cols-2">
						<Campo
							label="Período letivo *"
							value={form.periodo}
							onChange={(v) => setForm((f) => ({ ...f, periodo: v, turma: "" }))}
							opcoes={periodos.map((p) => p.codigo)}
						/>
						<Campo
							label="Curso *"
							value={form.curso}
							onChange={(v) => setForm((f) => ({ ...f, curso: v, turma: "" }))}
							opcoes={cursos}
						/>
						<Campo
							label="Turma *"
							value={form.turma}
							onChange={set("turma")}
							opcoes={turmasDisponiveis.map(rotuloDaTurma)}
							dica={
								!form.curso
									? "Escolha o curso para listar as turmas."
									: turmasDisponiveis.length === 0
										? "Nenhuma turma aberta com vagas para esse curso e período."
										: undefined
							}
						/>
						<Campo label="Forma de ingresso *" value={form.forma_ingresso} onChange={set("forma_ingresso")} opcoes={rotulosDe(formasIngresso)} />
					</div>
				)}

				{atual === "docs" && (
					<div className="space-y-3">
						<p className="text-sm text-suave">
							O envio de arquivos será ativado em uma próxima etapa. Por enquanto o cadastro é concluído sem anexos.
						</p>
						{["Documento de identidade", "CPF", "Certificado do Ensino Médio", "Comprovante de residência", "Foto 3x4", ...(menor ? ["Documento de identidade do responsável", "Termo de responsabilidade"] : [])].map((d) => (
							<label key={d} className="flex items-center justify-between gap-4 rounded-md border border-linha bg-white px-3 py-2 text-sm opacity-60">
								<span>{d}</span>
								<input type="file" className="text-xs" disabled />
							</label>
						))}
					</div>
				)}

				{atual === "resp" && (
					<div className="grid gap-4 md:grid-cols-2">
						<Campo className="md:col-span-2" label="Nome do responsável *" value={form.resp_nome} onChange={set("resp_nome")} />
						<Campo label="Parentesco *" value={form.resp_parentesco} onChange={set("resp_parentesco")} opcoes={rotulosDe(parentescos)} />
						<Campo label="CPF do responsável *" value={form.resp_cpf} onChange={set("resp_cpf")} />
						<Campo label="Data de nascimento *" type="date" value={form.resp_nascimento} onChange={set("resp_nascimento")} />
						<Campo label="Telefone *" value={form.resp_telefone} onChange={set("resp_telefone")} />
						<Campo label="E-mail *" type="email" value={form.resp_email} onChange={set("resp_email")} />
					</div>
				)}

				{atual === "revisao" && (
					<dl className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
						{([
							["Nome", form.nome], ["Nascimento", form.nascimento], ["CPF", form.cpf], ["E-mail", form.email],
							["Telefone", form.telefone], ["Cidade", `${form.cidade}/${form.uf}`], ["Curso", form.curso],
							["Turma", form.turma], ["Período", form.periodo], ["Forma de ingresso", form.forma_ingresso],
							...(menor ? [["Responsável", `${form.resp_nome} (${form.resp_parentesco})`]] : []),
						] as string[][]).map(([k, v]) => (
							<div key={k} className="border-b border-linha py-1">
								<dt className="text-xs uppercase text-suave">{k}</dt>
								<dd className="font-medium">{v || "—"}</dd>
							</div>
						))}
					</dl>
				)}
			</Cartao>

			{erro && <p className="mt-4 text-sm text-vermelho">{erro}</p>}

			<div className="mt-6 flex flex-wrap justify-between gap-2">
				<button className={classeBotao("claro")} disabled={enviando} onClick={guardarRascunho}>Salvar rascunho</button>
				<div className="flex gap-2">
					<button className={classeBotao("claro")} disabled={passo === 0} onClick={() => setPasso(passo - 1)}>Voltar</button>
					{atual !== "revisao" ? (
						<button className={classeBotao("primario")} disabled={faltando} onClick={() => setPasso(passo + 1)}>
							Continuar
						</button>
					) : (
						<button className={classeBotao("primario")} disabled={enviando} onClick={finalizar}>
							{enviando ? "Salvando..." : "Concluir cadastro"}
						</button>
					)}
				</div>
			</div>
		</>
	);
}