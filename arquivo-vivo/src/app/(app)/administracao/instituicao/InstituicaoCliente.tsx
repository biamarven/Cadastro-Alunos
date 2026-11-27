"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, Chip, Titulo, classeBotao } from "@/components/ui";
import { salvarInstituicao, salvarRegras } from "./actions";

type Instituicao = {
	razaoSocial: string;
	nomeFantasia: string;
	sigla: string;
	cnpj: string;
	credenciamento: string;
	cep: string;
	logradouro: string;
	numero: string;
	complemento: string;
	bairro: string;
	cidade: string;
	uf: string;
	email: string;
	telefone: string;
	site: string;
};

type Peso = { ordem: number; nome: string; peso: number };
type PeriodoLinha = { codigo: string; inicio: string; fim: string; status: string };

function numero(texto: string) {
	return Number(texto.trim().replace(",", "."));
}

function mostrar(n: number) {
	return String(n).replace(".", ",");
}

export default function InstituicaoCliente({
	podeEditar,
	instituicao,
	regras,
	pesos,
	periodos,
}: {
	podeEditar: boolean;
	instituicao: Instituicao;
	regras: { aprovacao: number; recuperacao: number; descarte: number };
	pesos: Peso[];
	periodos: PeriodoLinha[];
}) {
	const router = useRouter();
	const [salvando, iniciar] = useTransition();

	const [inst, setInst] = useState(instituicao);
	const [erroInst, setErroInst] = useState("");
	const [okInst, setOkInst] = useState(false);

	const [aprovacao, setAprovacao] = useState(mostrar(regras.aprovacao));
	const [recuperacao, setRecuperacao] = useState(mostrar(regras.recuperacao));
	const [descarte, setDescarte] = useState(String(regras.descarte));
	const [valoresPesos, setValoresPesos] = useState<Record<number, string>>(
		Object.fromEntries(pesos.map((p) => [p.ordem, mostrar(p.peso)])),
	);
	const [erroRegras, setErroRegras] = useState("");
	const [okRegras, setOkRegras] = useState(false);

	const soma = pesos.reduce((s, p) => s + (numero(valoresPesos[p.ordem] ?? "") || 0), 0);

	function campo(k: keyof Instituicao) {
		return (v: string) => {
			setOkInst(false);
			setInst((atual) => ({ ...atual, [k]: v }));
		};
	}

	function salvarDadosInstituicao() {
		setErroInst("");
		setOkInst(false);
		iniciar(async () => {
			const r = await salvarInstituicao(inst);
			if (r.erro) {
				setErroInst(r.erro);
				return;
			}
			setOkInst(true);
			router.refresh();
		});
	}

	function salvarDadosRegras() {
		setErroRegras("");
		setOkRegras(false);
		iniciar(async () => {
			const r = await salvarRegras({
				aprovacao: numero(aprovacao),
				recuperacao: numero(recuperacao),
				descarteDias: Number(descarte),
				pesos: pesos.map((p) => ({ ordem: p.ordem, peso: numero(valoresPesos[p.ordem] ?? "") })),
			});
			if (r.erro) {
				setErroRegras(r.erro);
				return;
			}
			setOkRegras(true);
			router.refresh();
		});
	}

	return (
		<>
			<Titulo titulo="Instituição e regras" sub="Dados da instituição, regra de notas e períodos">
				<Link href="/administracao" className={classeBotao("claro")}>Voltar</Link>
			</Titulo>

			<div className="space-y-6">
				<Cartao titulo="Dados da instituição">
					<div className="grid gap-4 md:grid-cols-2">
						<Campo className="md:col-span-2" label="Razão social *" value={inst.razaoSocial} onChange={campo("razaoSocial")} readOnly={!podeEditar} />
						<Campo label="Nome fantasia *" value={inst.nomeFantasia} onChange={campo("nomeFantasia")} readOnly={!podeEditar} />
						<Campo label="Sigla" value={inst.sigla} onChange={campo("sigla")} readOnly={!podeEditar} />
						<Campo label="CNPJ *" value={inst.cnpj} onChange={campo("cnpj")} readOnly={!podeEditar} placeholder="00.000.000/0000-00" />
						<Campo label="Credenciamento" value={inst.credenciamento} onChange={campo("credenciamento")} readOnly={!podeEditar} />
						<Campo label="CEP *" value={inst.cep} onChange={campo("cep")} readOnly={!podeEditar} />
						<Campo label="Logradouro *" value={inst.logradouro} onChange={campo("logradouro")} readOnly={!podeEditar} />
						<Campo label="Número *" value={inst.numero} onChange={campo("numero")} readOnly={!podeEditar} />
						<Campo label="Complemento" value={inst.complemento} onChange={campo("complemento")} readOnly={!podeEditar} />
						<Campo label="Bairro *" value={inst.bairro} onChange={campo("bairro")} readOnly={!podeEditar} />
						<Campo label="Cidade *" value={inst.cidade} onChange={campo("cidade")} readOnly={!podeEditar} />
						<Campo label="UF *" value={inst.uf} onChange={(v) => campo("uf")(v.toUpperCase().slice(0, 2))} readOnly={!podeEditar} />
						<Campo label="E-mail de contato *" type="email" value={inst.email} onChange={campo("email")} readOnly={!podeEditar} />
						<Campo label="Telefone *" value={inst.telefone} onChange={campo("telefone")} readOnly={!podeEditar} />
						<Campo className="md:col-span-2" label="Site" value={inst.site} onChange={campo("site")} readOnly={!podeEditar} />
					</div>
					{erroInst && <p className="mt-3 text-sm text-vermelho">{erroInst}</p>}
					{okInst && !erroInst && <p className="mt-3 text-sm text-suave">Dados da instituição salvos.</p>}
					{podeEditar && (
						<div className="mt-4 flex justify-end">
							<button className={classeBotao("primario")} disabled={salvando} onClick={salvarDadosInstituicao}>
								{salvando ? "Salvando..." : "Salvar dados da instituição"}
							</button>
						</div>
					)}
				</Cartao>

				<Cartao titulo="Regra de notas">
					<div className="grid gap-4 md:grid-cols-5">
						{pesos.map((p) => (
							<Campo
								key={p.ordem}
								label={`Peso ${p.nome} (%)`}
								value={valoresPesos[p.ordem] ?? ""}
								onChange={(v) => {
									setOkRegras(false);
									setValoresPesos((atual) => ({ ...atual, [p.ordem]: v }));
								}}
								readOnly={!podeEditar}
							/>
						))}
						<Campo label="Média p/ aprovar" value={aprovacao} onChange={(v) => { setOkRegras(false); setAprovacao(v); }} readOnly={!podeEditar} />
						<Campo label="Média p/ recuperação" value={recuperacao} onChange={(v) => { setOkRegras(false); setRecuperacao(v); }} readOnly={!podeEditar} />
						<Campo label="Descartar rascunhos após (dias)" type="number" value={descarte} onChange={(v) => { setOkRegras(false); setDescarte(v); }} readOnly={!podeEditar} />
					</div>
					{Math.abs(soma - 100) > 0.001 && (
						<p className="mt-2 text-sm text-vermelho">Os pesos precisam somar 100 (agora: {mostrar(soma)}).</p>
					)}
					<p className="mt-2 text-xs text-suave">
						Mudar os pesos vale para as disciplinas ofertadas daqui para frente. As que já foram ofertadas mantêm os pesos que tinham.
					</p>
					{erroRegras && <p className="mt-3 text-sm text-vermelho">{erroRegras}</p>}
					{okRegras && !erroRegras && <p className="mt-3 text-sm text-suave">Regras salvas.</p>}
					{podeEditar && (
						<div className="mt-4 flex justify-end">
							<button
								className={classeBotao("primario")}
								disabled={salvando || Math.abs(soma - 100) > 0.001}
								onClick={salvarDadosRegras}
							>
								{salvando ? "Salvando..." : "Salvar regras"}
							</button>
						</div>
					)}
				</Cartao>

				<Cartao titulo="Períodos letivos">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase text-suave">
								<th className="pb-2">Período</th><th className="pb-2">Início</th><th className="pb-2">Fim</th><th className="pb-2">Status</th>
							</tr>
						</thead>
						<tbody>
							{periodos.map((p) => (
								<tr key={p.codigo} className="border-t border-linha">
									<td className="py-2 font-mono">{p.codigo}</td>
									<td className="py-2">{p.inicio}</td>
									<td className="py-2">{p.fim}</td>
									<td className="py-2"><Chip tom={p.status === "Atual" ? "ok" : "neutro"}>{p.status}</Chip></td>
								</tr>
							))}
							{periodos.length === 0 && (
								<tr>
									<td colSpan={4} className="py-6 text-center text-suave">Nenhum período cadastrado. Crie na tela de Cursos e turmas.</td>
								</tr>
							)}
						</tbody>
					</table>
				</Cartao>
			</div>
		</>
	);
}