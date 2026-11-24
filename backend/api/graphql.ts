import { ApolloServer, HeaderMap } from "@apollo/server";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { GraphQLContext } from "../src/graphql/context.js";
import { initializeVercelDatabase } from "../src/lib/initialize-vercel-db.js";

type VercelRequest = IncomingMessage & { body?: unknown };

initializeVercelDatabase();
process.env.DATABASE_URL = "file:/tmp/financy.db";

let serverPromise: Promise<ApolloServer<GraphQLContext>> | undefined;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const { typeDefs, resolvers } = await import("../src/graphql/schema.js");
      const server = new ApolloServer({ typeDefs, resolvers });
      await server.start();
      return server;
    })();
  }

  return serverPromise!;
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }

  const server = await getServer();
  const { readAuthToken } = await import("../src/auth/auth.js");
  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method ?? "POST",
      headers,
      search: new URL(req.url ?? "/", "http://localhost").search,
      body,
    },
    context: async () => ({
      userId: readAuthToken(headers.get("authorization"))?.userId ?? null,
    }),
  });

  for (const [key, value] of response.headers) {
    res.setHeader(key, value);
  }
  res.statusCode = response.status ?? 200;

  if (response.body.kind === "complete") {
    res.end(response.body.string);
    return;
  }

  for await (const chunk of response.body.asyncIterator) {
    res.write(chunk);
  }
  res.end();
}
