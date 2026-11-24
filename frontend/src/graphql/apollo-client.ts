import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { getAuthToken } from "../auth/auth-storage";

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
