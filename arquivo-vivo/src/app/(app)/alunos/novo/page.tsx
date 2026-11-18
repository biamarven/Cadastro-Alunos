"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Titulo, classeBotao } from "@/components/ui";
import { cursos, turmas } from "@/lib/mock";
import { idade } from "@/lib/notas";

const vazio = {
	nome: "", nascimento: "", cpf: "", sexo: "",
	email: "", telefone: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "SC",
	curso: "", turma: "", turno: "", periodo: "2026.2",
	resp_nome: "", resp_parentesco: "", resp_cpf: "", resp_telefone: "", resp_email: "",
};
type Form = typeof vazio;

const obrigatorios: Record<string, (keyof Form)[]> = {
	pessoais: ["nome", "nascimento", "cpf"],
	contato: ["email", "telefone", "cidade"],
	curso: ["curso", "turma", "periodo"],
	docs: [],
	resp: ["resp_nome", "resp_parentesco", "resp_cpf", "resp_telefone"],
	revisao: [],
};

const nomesPassos: Record<string, string> = {
	pessoais: "Dados pessoais", contato: "Contato e endereço", curso: "Curso e turma",
	docs: "Documentos", resp: "Responsável legal", revisao: "Revisão",
};

type Rascunho = { id: string; form: Form; passo: number; salvoEm: string };
const CHAVE = "av_rascunhos";

export default function NovoAlunoPage() {
	const router = useRouter();
	const [form, setForm] = useState<Form>(vazio);
	const [passo, setPasso] = useState(0);
	const [pronto, setPronto] = useState(false);
	const idRascunho = useRef<string>(String(Date.now()));

	const menor = (idade(form.nascimento) ?? 99) < 18;
	const chaves = ["pessoais", "contato", "curso", "docs", ...(menor ? ["resp"] : []), "revisao"];
	const atual = chaves[Math.min(passo, chaves.length - 1)];
	const faltando = obrigatorios[atual].some((k) => !form[k].trim());

	function set(k: keyof Form) {
		return (v: string) => setForm((f) => ({ ...f, [k]: v }));
	}

	// Retomar rascunho: /alunos/novo?rascunho=ID
	useEffect(() => {
		const id = new URLSearchParams(window.location.search).get("rascunho");
		if (!id) return;
		const lista: Rascunho[] = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
		const r = lista.find((x) => x.id === id);
		if (r) {
			idRascunho.current = r.id;
			setForm(r.form);
			setPasso(r.passo);
		}
	}, []);

	function lerRascunhos(): Rascunho[] {
		return JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
	}

	function salvarRascunho() {
		const lista = lerRascunhos().filter((r) => r.id !== idRascunho.current);
		lista.push({ id: idRascunho.current, form, passo, salvoEm: new Date().toISOString() });
		localStorage.setItem(CHAVE, JSON.stringify(lista));
		router.push("/alunos/rascunhos");
	}

	function finalizar() {
		localStorage.setItem(CHAVE, JSON.stringify(lerRascunhos().filter((r) => r.id !== idRascunho.current)));
		setPronto(true);
	}

	const turmasDoCurso = turmas.filter((t) => t.curso === form.curso && t.periodo === form.periodo).map((t) => t.codigo);

	if (pronto) {
		return (
			<>
				<Titulo titulo="Aluno cadastrado" />
				<Cartao>
					<p className="mb-2">O cadastro de <strong>{form.nome}</strong> foi concluído.</p>
					<p className="mb-4 text-sm text-suave">
						Matrícula gerada: <span className="font-mono">{form.periodo}-0001</span> (exemplo; o número real será gerado pelo sistema).
					</p>
					<button className={classeBotao("primario")} onClick={() => router.push("/alunos")}>Ir para a lista de alunos</button>
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
						<Campo label="Sexo" value={form.sexo} onChange={set("sexo")} opcoes={["Feminino", "Masculino", "Outro", "Prefiro não informar"]} />
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
						<Campo label="Período letivo *" value={form.periodo} onChange={set("periodo")} opcoes={["2026.1", "2026.2"]} />
						<Campo label="Curso *" value={form.curso} onChange={set("curso")} opcoes={cursos.map((c) => c.nome)} />
						<Campo label="Turma *" value={form.turma} onChange={set("turma")} opcoes={turmasDoCurso}
							dica={form.curso ? undefined : "Escolha o curso para listar as turmas."} />
						<Campo label="Turno" value={form.turno} onChange={set("turno")} opcoes={["Manhã", "Tarde", "Noite"]} />
					</div>
				)}

				{atual === "docs" && (
					<div className="space-y-3">
						{["Documento de identidade", "CPF", "Certificado do Ensino Médio", "Comprovante de residência", "Foto 3x4", ...(menor ? ["Documento de identidade do responsável", "Termo de responsabilidade"] : [])].map((d) => (
							<label key={d} className="flex items-center justify-between gap-4 rounded-md border border-linha bg-white px-3 py-2 text-sm">
								<span>{d}</span>
								<input type="file" className="text-xs" />
							</label>
						))}
					</div>
				)}

				{atual === "resp" && (
					<div className="grid gap-4 md:grid-cols-2">
						<Campo className="md:col-span-2" label="Nome do responsável *" value={form.resp_nome} onChange={set("resp_nome")} />
						<Campo label="Parentesco *" value={form.resp_parentesco} onChange={set("resp_parentesco")} opcoes={["Mãe", "Pai", "Avó/Avô", "Tutor legal", "Outro"]} />
						<Campo label="CPF do responsável *" value={form.resp_cpf} onChange={set("resp_cpf")} />
						<Campo label="Telefone *" value={form.resp_telefone} onChange={set("resp_telefone")} />
						<Campo label="E-mail" type="email" value={form.resp_email} onChange={set("resp_email")} />
					</div>
				)}

				{atual === "revisao" && (
					<dl className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
						{([
							["Nome", form.nome], ["Nascimento", form.nascimento], ["CPF", form.cpf], ["E-mail", form.email],
							["Telefone", form.telefone], ["Cidade", `${form.cidade}/${form.uf}`], ["Curso", form.curso],
							["Turma", form.turma], ["Período", form.periodo],
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

			<div className="mt-6 flex flex-wrap justify-between gap-2">
				<button className={classeBotao("claro")} onClick={salvarRascunho}>Salvar rascunho</button>
				<div className="flex gap-2">
					<button className={classeBotao("claro")} disabled={passo === 0} onClick={() => setPasso(passo - 1)}>Voltar</button>
					{atual !== "revisao" ? (
						<button className={classeBotao("primario")} disabled={faltando} onClick={() => setPasso(passo + 1)}>
							Continuar
						</button>
					) : (
						<button className={classeBotao("primario")} onClick={finalizar}>Concluir cadastro</button>
					)}
				</div>
			</div>
		</>
	);
}