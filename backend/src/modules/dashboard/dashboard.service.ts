import { TransactionType } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

function monthRange(referenceDate?: string | Date | null) {
  const reference = referenceDate ? new Date(referenceDate) : new Date();
  const validReference = Number.isNaN(reference.getTime()) ? new Date() : reference;

  return {
    start: new Date(
      Date.UTC(validReference.getUTCFullYear(), validReference.getUTCMonth(), 1),
    ),
    end: new Date(
      Date.UTC(validReference.getUTCFullYear(), validReference.getUTCMonth() + 1, 1),
    ),
  };
}

function decimalToNumber(value: { toNumber: () => number } | null | undefined) {
  return value?.toNumber() ?? 0;
}

export async function getDashboard(userId: string, referenceDate?: string | Date | null) {
  const { start, end } = monthRange(referenceDate);
  const monthFilter = { gte: start, lt: end };

  const [allIncome, allExpense, monthlyIncome, monthlyExpense, recentTransactions, grouped] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.INCOME, date: monthFilter },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE, date: monthFilter },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: { category: true },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { userId, date: monthFilter },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

  const categoryIds = grouped.map((item) => item.categoryId);
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: categoryIds } },
  });
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  const totalIncome = decimalToNumber(allIncome._sum.amount);
  const totalExpense = decimalToNumber(allExpense._sum.amount);

  return {
    totalBalance: totalIncome - totalExpense,
    monthlyIncome: decimalToNumber(monthlyIncome._sum.amount),
    monthlyExpense: decimalToNumber(monthlyExpense._sum.amount),
    referenceMonth: start,
    recentTransactions,
    categorySummary: grouped
      .map((item) => ({
        category: categoriesById.get(item.categoryId),
        transactionCount: item._count._all,
        totalAmount: decimalToNumber(item._sum.amount),
      }))
      .filter((item) => item.category)
      .sort((a, b) => b.totalAmount - a.totalAmount),
  };
}
