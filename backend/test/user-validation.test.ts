import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "file:./test.db";
process.env.JWT_SECRET ??= "test-secret-with-at-least-32-characters";

const { registerUser, updateUserProfile } = await import("../src/modules/users/user.service.js");

test("recusa cadastro com senha menor que oito caracteres", async () => {
  await assert.rejects(
    registerUser({ name: "Usuário", email: "user@example.com", password: "1234567" }),
    /pelo menos 8 caracteres/,
  );
});

test("recusa nome de perfil vazio ou muito curto", () => {
  assert.throws(() => updateUserProfile("user-id", { name: " " }), /pelo menos 2 caracteres/);
  assert.throws(() => updateUserProfile("user-id", { name: "A" }), /pelo menos 2 caracteres/);
});
