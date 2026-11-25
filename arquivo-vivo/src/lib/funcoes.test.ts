
import { test } from "node:test";
import assert from "node:assert/strict";

import { formatarCpf, mascararCpf } from "./formatos.ts";
import { converter, calcular } from "./notas.ts";

// TESTES DE CPF

test("1 - Formatação de CPF com onze dígitos", () => {
  assert.equal(
    formatarCpf("52998224725"),
    "529.982.247-25"
  );
});

test("2 - Manutenção do CPF quando não possui onze dígitos", () => {
  assert.equal(formatarCpf("123456"), "123456");
});

test("3 - Máscara dos primeiros dígitos do CPF", () => {
  assert.equal(
    mascararCpf("52998224725"),
    "•••.•••.•••-25"
  );
});

test("4 - Retorno de traço quando o CPF não possui onze dígitos", () => {
  assert.equal(mascararCpf("123456"), "—");
});

// TESTES DE NOTAS

test("5 - Conversão de nota com vírgula para número", () => {
  assert.equal(converter("7,5"), 7.5);
});

test("6 - Rejeição de nota menor que zero", () => {
  assert.equal(converter("-2"), null);
});

test("7 - Rejeição de nota maior que dez", () => {
  assert.equal(converter("11"), null);
});

test("8 - Rejeição de texto que não representa uma nota", () => {
  assert.equal(converter("abc"), null);
});

test("9 - Cálculo correto da média ponderada", () => {
  assert.deepEqual(
    calcular("10", "8", "6"),
    { media: 7.8, situacao: "Aprovado" }
  );
});

test("10 - Classificação de média entre cinco e sete como recuperação", () => {
  assert.deepEqual(
    calcular("5", "6", "7"),
    { media: 6.1, situacao: "Recuperação" }
  );
});

test("11 - Classificação de média abaixo de cinco como reprovado", () => {
  assert.deepEqual(
    calcular("3", "4", "4"),
    { media: 3.7, situacao: "Reprovado" }
  );
});

test("12 - Manutenção da situação em andamento quando falta uma nota", () => {
  assert.deepEqual(
    calcular("8", "", "7"),
    { media: null, situacao: "Em andamento" }
  );
});
