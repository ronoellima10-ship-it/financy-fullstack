import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("A variável JWT_SECRET não foi configurada.");
  }

  return secret;
}

export function createAuthToken(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), {
    subject: userId,
    expiresIn: "7d",
  });
}

export function readAuthToken(authorization?: string): AuthTokenPayload | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload === "string" || !payload.sub) {
      return null;
    }

    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export function requireUserId(userId: string | null): string {
  if (!userId) {
    throw new GraphQLError("Autenticação necessária.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return userId;
}
