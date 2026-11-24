import { PrismaClient, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Alimentação", description: "Restaurantes, delivery e refeições", icon: "utensils", color: "#2563EB" },
  { name: "Entretenimento", description: "Cinema, jogos e lazer", icon: "ticket", color: "#DB2777" },
  { name: "Investimento", description: "Aplicações e retornos financeiros", icon: "piggy-bank", color: "#16A34A" },
  { name: "Mercado", description: "Compras de supermercado e mantimentos", icon: "shopping-cart", color: "#EA580C" },
  { name: "Salário", description: "Renda mensal e bonificações", icon: "briefcase-business", color: "#16A34A" },
  { name: "Saúde", description: "Medicamentos, consultas e exames", icon: "heart-pulse", color: "#DC2626" },
  { name: "Transporte", description: "Gasolina, transporte público e viagens", icon: "car-front", color: "#9333EA" },
  { name: "Utilidades", description: "Energia, água, internet e telefone", icon: "tool-case", color: "#CA8A04" },
] as const;

async function main() {
  const email = "demo@financy.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Conta demonstração" },
    create: {
      name: "Conta demonstração",
      email,
      passwordHash: await bcrypt.hash("Financy123", 12),
    },
  });

  const savedCategories = await Promise.all(categories.map((category) =>
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: category.name } },
      update: category,
      create: { ...category, userId: user.id },
    }),
  ));
  const byName = new Map(savedCategories.map((category) => [category.name, category]));

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  const now = new Date();
  const date = (day: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 12));
  await prisma.transaction.createMany({ data: [
    { userId: user.id, categoryId: byName.get("Salário")!.id, title: "Pagamento de salário", amount: 4250, type: TransactionType.INCOME, date: date(1) },
    { userId: user.id, categoryId: byName.get("Alimentação")!.id, title: "Jantar no restaurante", amount: 89.5, type: TransactionType.EXPENSE, date: date(4) },
    { userId: user.id, categoryId: byName.get("Transporte")!.id, title: "Posto de gasolina", amount: 100, type: TransactionType.EXPENSE, date: date(7) },
    { userId: user.id, categoryId: byName.get("Mercado")!.id, title: "Compras no mercado", amount: 156.8, type: TransactionType.EXPENSE, date: date(10) },
    { userId: user.id, categoryId: byName.get("Investimento")!.id, title: "Retorno de investimento", amount: 340.25, type: TransactionType.INCOME, date: date(12) },
    { userId: user.id, categoryId: byName.get("Utilidades")!.id, title: "Conta de internet", amount: 119.9, type: TransactionType.EXPENSE, date: date(15) },
    { userId: user.id, categoryId: byName.get("Entretenimento")!.id, title: "Cinema", amount: 88, type: TransactionType.EXPENSE, date: date(18) },
  ] });

  console.log("Dados de demonstração criados.");
  console.log("Login: demo@financy.com | Senha: Financy123");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
