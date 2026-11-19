import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const [nome, email, senha] = process.argv.slice(2);

if (!nome || !email || !senha) {
	console.error('Uso: node --env-file=.env.local scripts/criar-admin.mjs "Nome" "email" "senha"');
	process.exit(1);
}

if (senha.length < 8) {
	console.error("A senha precisa ter ao menos 8 caracteres.");
	process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const perfis = await sql`
	select id
	from perfil
	where 1=1
	and nome = 'Administrador'
`;

if (perfis.length === 0) {
	console.error("Perfil Administrador não encontrado. Rode o 02_dados_iniciais.sql antes.");
	process.exit(1);
}

const existentes = await sql`
	select id
	from usuario
	where 1=1
	and lower(email) = lower(${email})
`;

if (existentes.length > 0) {
	console.error("Já existe um usuário com esse e-mail.");
	process.exit(1);
}

const senhaHash = await bcrypt.hash(senha, 12);

await sql`
	insert into usuario (nome, email, perfil_id, senha_hash)
	values (${nome}, ${email}, ${perfis[0].id}, ${senhaHash})
`;

console.log("Administrador criado:", email);