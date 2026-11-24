import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";

const databasePath = "/tmp/financy.db";

export function initializeVercelDatabase() {
  const db = new DatabaseSync(databasePath);

  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
    CREATE TABLE IF NOT EXISTS "Category" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "icon" TEXT NOT NULL, "color" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
    CREATE TABLE IF NOT EXISTS "Transaction" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "type" TEXT NOT NULL, "date" DATETIME NOT NULL, "description" TEXT, "userId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE);
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_key" ON "Category"("userId", "name");
  `);

  const existing = db.prepare('SELECT "id" FROM "User" WHERE "email" = ?').get("demo@financy.com");
  if (existing) {
    db.close();
    return;
  }

  const now = new Date().toISOString();
  const userId = "demo-user-financy";
  db.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`)
    .run(userId, "Conta demonstração", "demo@financy.com", bcrypt.hashSync("Financy123", 12), now, now);

  const categories = [
    ["alimentacao", "Alimentação", "Restaurantes, delivery e refeições", "utensils", "#2563EB"],
    ["entretenimento", "Entretenimento", "Cinema, jogos e lazer", "ticket", "#DB2777"],
    ["investimento", "Investimento", "Aplicações e retornos financeiros", "piggy-bank", "#16A34A"],
    ["mercado", "Mercado", "Compras de supermercado e mantimentos", "shopping-cart", "#EA580C"],
    ["salario", "Salário", "Renda mensal e bonificações", "briefcase-business", "#16A34A"],
    ["saude", "Saúde", "Medicamentos, consultas e exames", "heart-pulse", "#DC2626"],
    ["transporte", "Transporte", "Gasolina, transporte público e viagens", "car-front", "#9333EA"],
    ["utilidades", "Utilidades", "Energia, água, internet e telefone", "tool-case", "#CA8A04"],
  ];
  const insertCategory = db.prepare(`INSERT INTO "Category" ("id", "name", "description", "icon", "color", "userId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const category of categories) insertCategory.run(...category, userId, now, now);

  const current = new Date();
  const date = (day: number) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), day, 12)).toISOString();
  const transactions: Array<[string, string, number, string, string, string]> = [
    ["t1", "Pagamento de salário", 4250, "INCOME", date(1), "salario"],
    ["t2", "Jantar no restaurante", 89.5, "EXPENSE", date(4), "alimentacao"],
    ["t3", "Posto de gasolina", 100, "EXPENSE", date(7), "transporte"],
    ["t4", "Compras no mercado", 156.8, "EXPENSE", date(10), "mercado"],
    ["t5", "Retorno de investimento", 340.25, "INCOME", date(12), "investimento"],
    ["t6", "Conta de internet", 119.9, "EXPENSE", date(15), "utilidades"],
    ["t7", "Cinema", 88, "EXPENSE", date(18), "entretenimento"],
  ];
  const insertTransaction = db.prepare(`INSERT INTO "Transaction" ("id", "title", "amount", "type", "date", "userId", "categoryId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [id, title, amount, type, transactionDate, categoryId] of transactions) {
    insertTransaction.run(id, title, amount, type, transactionDate, userId, categoryId, now, now);
  }
  db.close();
}
