import { GraphQLError } from "graphql";

import { prisma } from "../../lib/prisma.js";

type CreateCategoryInput = {
  name: string;
  description?: string | null;
  icon: string;
  color: string;
};

type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  icon?: string;
  color?: string;
};

function normalizeRequiredText(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new GraphQLError(`${field} é obrigatório.`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return normalized;
}

function normalizeDescription(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true } },
    },
  });
}

export function findCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { transactions: true } },
    },
  });
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  try {
    return await prisma.category.create({
      data: {
        userId,
        name: normalizeRequiredText(input.name, "Nome"),
        description: normalizeDescription(input.description),
        icon: normalizeRequiredText(input.icon, "Ícone"),
        color: normalizeRequiredText(input.color, "Cor"),
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  } catch (error) {
    handleCategoryDatabaseError(error);
  }
}

export async function updateCategory(
  id: string,
  userId: string,
  input: UpdateCategoryInput,
) {
  await ensureCategoryOwnership(id, userId);

  try {
    return await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined && {
          name: normalizeRequiredText(input.name, "Nome"),
        }),
        ...(input.description !== undefined && {
          description: normalizeDescription(input.description),
        }),
        ...(input.icon !== undefined && {
          icon: normalizeRequiredText(input.icon, "Ícone"),
        }),
        ...(input.color !== undefined && {
          color: normalizeRequiredText(input.color, "Cor"),
        }),
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  } catch (error) {
    handleCategoryDatabaseError(error);
  }
}

export async function deleteCategory(id: string, userId: string) {
  await ensureCategoryOwnership(id, userId);

  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new GraphQLError("Não é possível excluir uma categoria que possui transações.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    throw error;
  }
}

async function ensureCategoryOwnership(id: string, userId: string) {
  const category = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!category) {
    throw new GraphQLError("Categoria não encontrada.", {
      extensions: { code: "NOT_FOUND" },
    });
  }
}

function handleCategoryDatabaseError(error: unknown): never {
  if (isPrismaError(error, "P2002")) {
    throw new GraphQLError("Já existe uma categoria com este nome.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  throw error;
}

function isPrismaError(error: unknown, code: string): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
