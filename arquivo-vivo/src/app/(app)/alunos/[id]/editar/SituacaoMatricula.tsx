"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Cartao, classeBotao } from "@/components/ui";
import { alterarSituacaoMatricula } from "./actions";

type MatriculaSituacao = { id: string; numero: string; curso: string; situacao: string };

const SITUACOES: Record<string, string> = { ativa: "Ativa", trancada: "Trancada", inativa: "Inativa" };

const MOTIVOS: Record<string, string> = {
	desistencia: "Desistência",
	transferencia: "Transferência",
	conclusao: "Conclusão",
	trancamento: "Trancamento",
	reabertura: "Reabertura",
	outro: "Outro",
};

const MOTIVOS_POR_SITUACAO: Record<string, string[]> = {
	ativa: ["reabertura", "outro"],
	trancada: ["trancamento", "outro"],
	inativa: ["desistencia", "transferencia", "conclusao", "outro"],
};

function chaveDe(mapa: Record<string, string>, rotulo: string) {
	return Object.keys(mapa).find((k) => mapa[k] === rotulo) ?? "";
}

function LinhaMatricula({ m }: { m: MatriculaSituacao }) {
	const router = useRouter();
	const [pendente, iniciar] = useTransition();
	const [erro, setErro] = useState("");
	const [nova, setNova] = useState(m.situacao);
	const [motivo, setMotivo] = useState("");
	const [data, setData] = useState(new Date().toLocaleDateString("sv-SE"));
	const [obs, setObs] = useState("");

	const opcoesMotivo = MOTIVOS_POR_SITUACAO[nova] ?? [];
	const motivoValido = opcoesMotivo.includes(motivo) ? motivo : (opcoesMotivo[0] ?? "");

	function aplicar() {
		setErro("");
		iniciar(async () => {
			const r = await alterarSituacaoMatricula(m.id, nova, motivoValido, data, obs);
			if (r.erro) {
				setErro(r.erro);
				return;
			}
			setObs("");
			router.refresh();
		});
	}

	return (
		<Cartao titulo={`Matrícula ${m.numero} · ${m.curso}`}>
			<div className="grid gap-4 md:grid-cols-2">
				<Campo label="Situação atual" value={SITUACOES[m.situacao] ?? m.situacao} readOnly />
				<Campo
					label="Nova situação"
					value={SITUACOES[nova]}
					opcoes={Object.values(SITUACOES)}
					onChange={(v) => setNova(chaveDe(SITUACOES, v))}
				/>
				<Campo
					label="Motivo"
					value={MOTIVOS[motivoValido]}
					opcoes={opcoesMotivo.map((k) => MOTIVOS[k])}
					onChange={(v) => setMotivo(chaveDe(MOTIVOS, v))}
				/>
				<Campo label="Data de efeito" type="date" value={data} onChange={setData} />
				<Campo className="md:col-span-2" label="Observação" value={obs} onChange={setObs} />
			</div>
			{erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={aplicar}
					disabled={pendente || nova === m.situacao}
					className={classeBotao("primario")}
				>
					{pendente ? "Salvando..." : "Alterar situação"}
				</button>
			</div>
		</Cartao>
	);
}

export default function SituacaoMatricula({ matriculas }: { matriculas: MatriculaSituacao[] }) {
	return (
		<div className="mt-6 space-y-6">
			{matriculas.map((m) => (
				<LinhaMatricula key={m.id} m={m} />
			))}
		</div>
	);
}