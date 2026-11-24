import { GraphQLError, GraphQLScalarType, Kind } from "graphql";

import { requireUserId } from "../auth/auth.js";
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory,
} from "../modules/categories/category.service.js";
import { getDashboard } from "../modules/dashboard/dashboard.service.js";
import {
  createTransaction,
  deleteTransaction,
  findTransactionById,
  listTransactions,
  updateTransaction,
} from "../modules/transactions/transaction.service.js";
import { findUserById, loginUser, registerUser, updateUserProfile } from "../modules/users/user.service.js";
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

  enum TransactionType {
    INCOME
    EXPENSE
  }

  type Transaction {
    id: ID!
    title: String!
    amount: Float!
    type: TransactionType!
    date: DateTime!
    description: String
    category: Category!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CategorySummary {
    category: Category!
    transactionCount: Int!
    totalAmount: Float!
  }

  type Dashboard {
    totalBalance: Float!
    monthlyIncome: Float!
    monthlyExpense: Float!
    referenceMonth: DateTime!
    recentTransactions: [Transaction!]!
    categorySummary: [CategorySummary!]!
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

  input UpdateProfileInput {
    name: String!
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

  input CreateTransactionInput {
    title: String!
    amount: Float!
    type: TransactionType!
    date: DateTime!
    description: String
    categoryId: ID!
  }

  input UpdateTransactionInput {
    title: String
    amount: Float
    type: TransactionType
    date: DateTime
    description: String
    categoryId: ID
  }

  type Query {
    health: String!
    me: User!
    categories: [Category!]!
    category(id: ID!): Category!
    transactions: [Transaction!]!
    transaction(id: ID!): Transaction!
    dashboard(referenceDate: DateTime): Dashboard!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
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
  Transaction: {
    amount: (transaction: { amount: { toNumber?: () => number } | number }) =>
      typeof transaction.amount === "number"
        ? transaction.amount
        : transaction.amount.toNumber?.() ?? Number(transaction.amount),
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
    transactions: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      listTransactions(requireUserId(context.userId)),
    transaction: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const transaction = await findTransactionById(
        args.id,
        requireUserId(context.userId),
      );

      if (!transaction) {
        throw new GraphQLError("Transação não encontrada.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return transaction;
    },
    dashboard: (
      _parent: unknown,
      args: { referenceDate?: string | Date | null },
      context: GraphQLContext,
    ) => getDashboard(requireUserId(context.userId), args.referenceDate),
  },
  Mutation: {
    register: (_parent: unknown, args: { input: Parameters<typeof registerUser>[0] }) =>
      registerUser(args.input),
    login: (_parent: unknown, args: { input: Parameters<typeof loginUser>[0] }) =>
      loginUser(args.input),
    updateProfile: (
      _parent: unknown,
      args: { input: Parameters<typeof updateUserProfile>[1] },
      context: GraphQLContext,
    ) => updateUserProfile(requireUserId(context.userId), args.input),
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
    createTransaction: (
      _parent: unknown,
      args: { input: Parameters<typeof createTransaction>[1] },
      context: GraphQLContext,
    ) => createTransaction(requireUserId(context.userId), args.input),
    updateTransaction: (
      _parent: unknown,
      args: { id: string; input: Parameters<typeof updateTransaction>[2] },
      context: GraphQLContext,
    ) => updateTransaction(args.id, requireUserId(context.userId), args.input),
    deleteTransaction: (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => deleteTransaction(args.id, requireUserId(context.userId)),
  },
};
