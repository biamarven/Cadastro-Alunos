import { Titulo } from "@/components/ui";
import FormSenha from "./FormSenha";

export const dynamic = "force-dynamic";

export default function TrocarSenhaPage() {
	return (
		<>
			<Titulo titulo="Trocar senha" sub="Escolha uma senha nova para a sua conta" />
			<FormSenha />
		</>
	);
}