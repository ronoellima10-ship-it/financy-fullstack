import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { createContext } from "./graphql/context.js";
import { resolvers, typeDefs } from "./graphql/schema.js";

const port = Number(process.env.PORT ?? 4000);
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: createContext,
});

console.log(`Financy API disponível em ${url}`);
