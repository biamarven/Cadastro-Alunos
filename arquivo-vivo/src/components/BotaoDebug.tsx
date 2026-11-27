"use client";

import { useEffect, useState } from "react";

export default function BotaoDebug() {
	const [ligado, setLigado] = useState(false);

	useEffect(() => {
		let salvo = false;
		try {
			salvo = localStorage.getItem("av_debug") === "on";
		} catch {
			salvo = false;
		}
		setLigado(salvo);
		document.documentElement.dataset.debug = salvo ? "on" : "off";
	}, []);

	function alternar() {
		const novo = !ligado;
		setLigado(novo);
		document.documentElement.dataset.debug = novo ? "on" : "off";
		try {
			localStorage.setItem("av_debug", novo ? "on" : "off");
		} catch {
			// sem armazenamento: vale só nesta página
		}
	}

	return (
		<button type="button" onClick={alternar} className="text-xs text-stone-400 hover:text-white">
			Debug: {ligado ? "ligado" : "desligado"}
		</button>
	);
}