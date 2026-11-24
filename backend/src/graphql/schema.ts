export const typeDefs = `#graphql
  type Query {
    health: String!
  }
`;

export const resolvers = {
  Query: {
    health: () => "Financy API online",
  },
};
