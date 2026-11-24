import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

import { createAuthToken } from "../../auth/auth.js";
import { prisma } from "../../lib/prisma.js";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new GraphQLError("A senha deve possuir pelo menos 8 caracteres.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

export async function registerUser(input: RegisterInput) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name || !email) {
    throw new GraphQLError("Nome e e-mail são obrigatórios.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  validatePassword(input.password);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new GraphQLError("Já existe uma conta com este e-mail.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: publicUserSelect,
  });

  return {
    token: createAuthToken(user.id),
    user,
  };
}

export async function loginUser(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const userWithPassword = await prisma.user.findUnique({ where: { email } });

  if (!userWithPassword) {
    throw invalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(input.password, userWithPassword.passwordHash);

  if (!passwordMatches) {
    throw invalidCredentialsError();
  }

  const { passwordHash: _, ...user } = userWithPassword;

  return {
    token: createAuthToken(user.id),
    user,
  };
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
}

function invalidCredentialsError() {
  return new GraphQLError("E-mail ou senha inválidos.", {
    extensions: { code: "UNAUTHENTICATED" },
  });
}
