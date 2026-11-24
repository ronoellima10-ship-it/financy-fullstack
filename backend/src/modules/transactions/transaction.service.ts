import { TransactionType } from "@prisma/client";
import { GraphQLError } from "graphql";

import { prisma } from "../../lib/prisma.js";

type TransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  date: string | Date;
  description?: string | null;
  categoryId: string;
};

type UpdateTransactionInput = Partial<TransactionInput>;

function normalizeTitle(value: string) {
  const title = value.trim();

  if (!title) {
    throw new GraphQLError("O título é obrigatório.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return title;
}

function normalizeAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new GraphQLError("O valor deve ser maior que zero.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return value;
}

function normalizeDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError("A data informada é inválida.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return date;
}

function normalizeDescription(value?: string | null) {
  const description = value?.trim();
  return description ? description : null;
}

async function ensureCategoryOwnership(categoryId: string, userId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });

  if (!category) {
    throw new GraphQLError("Categoria não encontrada.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

async function ensureTransactionOwnership(id: string, userId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!transaction) {
    throw new GraphQLError("Transação não encontrada.", {
      extensions: { code: "NOT_FOUND" },
    });
  }
}

export function listTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { category: true },
  });
}

export function findTransactionById(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

export async function createTransaction(userId: string, input: TransactionInput) {
  await ensureCategoryOwnership(input.categoryId, userId);

  return prisma.transaction.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: normalizeTitle(input.title),
      amount: normalizeAmount(input.amount),
      type: input.type,
      date: normalizeDate(input.date),
      description: normalizeDescription(input.description),
    },
    include: { category: true },
  });
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput,
) {
  await ensureTransactionOwnership(id, userId);

  if (input.categoryId !== undefined) {
    await ensureCategoryOwnership(input.categoryId, userId);
  }

  return prisma.transaction.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: normalizeTitle(input.title) }),
      ...(input.amount !== undefined && { amount: normalizeAmount(input.amount) }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.date !== undefined && { date: normalizeDate(input.date) }),
      ...(input.description !== undefined && {
        description: normalizeDescription(input.description),
      }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    },
    include: { category: true },
  });
}

export async function deleteTransaction(id: string, userId: string) {
  await ensureTransactionOwnership(id, userId);
  await prisma.transaction.delete({ where: { id } });
  return true;
}
