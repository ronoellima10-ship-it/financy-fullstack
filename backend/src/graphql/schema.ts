import { GraphQLError } from "graphql";

import { requireUserId } from "../auth/auth.js";
import { findUserById, loginUser, registerUser } from "../modules/users/user.service.js";
import type { GraphQLContext } from "./context.js";

export const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    health: String!
    me: User!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
  }
`;

export const resolvers = {
  Query: {
    health: () => "Financy API online",
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const userId = requireUserId(context.userId);
      const user = await findUserById(userId);

      if (!user) {
        throw new GraphQLError("Usuário não encontrado.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
    },
  },
  Mutation: {
    register: (_parent: unknown, args: { input: Parameters<typeof registerUser>[0] }) =>
      registerUser(args.input),
    login: (_parent: unknown, args: { input: Parameters<typeof loginUser>[0] }) =>
      loginUser(args.input),
  },
};
