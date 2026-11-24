import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";

const { createAuthToken, readAuthToken, requireUserId } = await import("../src/auth/auth.js");

test("cria e lê um token de autenticação válido", () => {
  const token = createAuthToken("user-123");
  assert.deepEqual(readAuthToken(`Bearer ${token}`), { userId: "user-123" });
});

test("rejeita cabeçalho ou token inválido", () => {
  assert.equal(readAuthToken(), null);
  assert.equal(readAuthToken("Basic token"), null);
  assert.equal(readAuthToken("Bearer token-invalido"), null);
});

test("exige usuário autenticado nas operações protegidas", () => {
  assert.equal(requireUserId("user-123"), "user-123");
  assert.throws(() => requireUserId(null), /Autenticação necessária/);
});
