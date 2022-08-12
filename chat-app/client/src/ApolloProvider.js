import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  ApolloProvider as Provider,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP Link for Queries and Mutations
let httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Authentication
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

httpLink = authLink.concat(httpLink);

// WebSocket Link for Subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
);

// Split Links to serve both Operations
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === 'OperationDefinition' && def.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default function ApolloProvider(props) {
  return <Provider client={client} {...props} />;
}
