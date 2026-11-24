import assert from "node:assert/strict";
import { existsSync, unlinkSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const databasePath = `/tmp/financy-integration-${process.pid}.db`;
process.env.DATABASE_URL = `file:${databasePath}`;
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";

const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
  CREATE TABLE "Category" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "icon" TEXT NOT NULL, "color" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
  CREATE TABLE "Transaction" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "type" TEXT NOT NULL, "date" DATETIME NOT NULL, "description" TEXT, "userId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE);
  CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
  CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
`);
database.close();

const { prisma } = await import("../src/lib/prisma.js");
const { registerUser } = await import("../src/modules/users/user.service.js");
const {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} = await import("../src/modules/categories/category.service.js");
const {
  createTransaction,
  deleteTransaction,
  findTransactionById,
  listTransactions,
  updateTransaction,
} = await import("../src/modules/transactions/transaction.service.js");

test("executa os CRUDs e impede acesso aos dados de outro usuário", async () => {
  try {
    const accountA = await registerUser({
      name: "Usuário A",
      email: "a@financy.test",
      password: "senha-segura-a",
    });
    const accountB = await registerUser({
      name: "Usuário B",
      email: "b@financy.test",
      password: "senha-segura-b",
    });

    const categoryA = await createCategory(accountA.user.id, {
      name: "Mercado",
      description: "Compras mensais",
      icon: "shopping-cart",
      color: "#EA580C",
    });
    const categoryB = await createCategory(accountB.user.id, {
      name: "Mercado",
      description: "Categoria do segundo usuário",
      icon: "shopping-cart",
      color: "#2563EB",
    });

    assert.equal((await listCategories(accountA.user.id)).length, 1);
    assert.equal((await listCategories(accountB.user.id))[0]?.id, categoryB.id);
    await assert.rejects(
      updateCategory(categoryA.id, accountB.user.id, { name: "Invadida" }),
      /Categoria não encontrada/,
    );

    const updatedCategory = await updateCategory(categoryA.id, accountA.user.id, {
      name: "Supermercado",
    });
    assert.equal(updatedCategory.name, "Supermercado");

    const transaction = await createTransaction(accountA.user.id, {
      title: "Compras da semana",
      amount: 150.75,
      type: "EXPENSE",
      date: "2026-11-24T12:00:00.000Z",
      categoryId: categoryA.id,
    });

    assert.equal((await listTransactions(accountA.user.id)).length, 1);
    assert.equal((await listTransactions(accountB.user.id)).length, 0);
    assert.equal(await findTransactionById(transaction.id, accountB.user.id), null);
    await assert.rejects(
      updateTransaction(transaction.id, accountB.user.id, { title: "Invadida" }),
      /Transação não encontrada/,
    );
    await assert.rejects(
      deleteTransaction(transaction.id, accountB.user.id),
      /Transação não encontrada/,
    );

    const updatedTransaction = await updateTransaction(transaction.id, accountA.user.id, {
      title: "Compras atualizadas",
      amount: 175.5,
    });
    assert.equal(updatedTransaction.title, "Compras atualizadas");
    assert.equal(Number(updatedTransaction.amount), 175.5);

    assert.equal(await deleteTransaction(transaction.id, accountA.user.id), true);
    assert.equal((await listTransactions(accountA.user.id)).length, 0);
    assert.equal(await deleteCategory(categoryA.id, accountA.user.id), true);
    assert.equal((await listCategories(accountA.user.id)).length, 0);
  } finally {
    await prisma.$disconnect();
    if (existsSync(databasePath)) unlinkSync(databasePath);
  }
});
