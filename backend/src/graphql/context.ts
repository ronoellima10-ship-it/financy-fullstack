import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";

import { readAuthToken } from "../auth/auth.js";

export type GraphQLContext = {
  userId: string | null;
};

export async function createContext({
  req,
}: StandaloneServerContextFunctionArgument): Promise<GraphQLContext> {
  const payload = readAuthToken(req.headers.authorization);

  return {
    userId: payload?.userId ?? null,
  };
}
