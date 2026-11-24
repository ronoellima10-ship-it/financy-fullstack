import { GraphQLError, GraphQLScalarType, Kind } from "graphql";

import { requireUserId } from "../auth/auth.js";
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory,
} from "../modules/categories/category.service.js";
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

  type Category {
    id: ID!
    name: String!
    description: String
    icon: String!
    color: String!
    transactionCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
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

  input CreateCategoryInput {
    name: String!
    description: String
    icon: String!
    color: String!
  }

  input UpdateCategoryInput {
    name: String
    description: String
    icon: String
    color: String
  }

  type Query {
    health: String!
    me: User!
    categories: [Category!]!
    category(id: ID!): Category!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
  }
`;

export const resolvers = {
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    serialize: (value) => (value instanceof Date ? value.toISOString() : value),
    parseValue: (value) => new Date(String(value)),
    parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
  }),
  Category: {
    transactionCount: (category: { _count?: { transactions: number } }) =>
      category._count?.transactions ?? 0,
  },
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
    categories: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      listCategories(requireUserId(context.userId)),
    category: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const category = await findCategoryById(args.id, requireUserId(context.userId));

      if (!category) {
        throw new GraphQLError("Categoria não encontrada.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return category;
    },
  },
  Mutation: {
    register: (_parent: unknown, args: { input: Parameters<typeof registerUser>[0] }) =>
      registerUser(args.input),
    login: (_parent: unknown, args: { input: Parameters<typeof loginUser>[0] }) =>
      loginUser(args.input),
    createCategory: (
      _parent: unknown,
      args: { input: Parameters<typeof createCategory>[1] },
      context: GraphQLContext,
    ) => createCategory(requireUserId(context.userId), args.input),
    updateCategory: (
      _parent: unknown,
      args: { id: string; input: Parameters<typeof updateCategory>[2] },
      context: GraphQLContext,
    ) => updateCategory(args.id, requireUserId(context.userId), args.input),
    deleteCategory: (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => deleteCategory(args.id, requireUserId(context.userId)),
  },
};
