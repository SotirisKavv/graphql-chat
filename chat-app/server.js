const express = require('express');
const { createServer } = require('http');

const { ApolloServer } = require('apollo-server-express');
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

const { sequelize } = require('./models');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const contextMiddleware = require('./util/contextMiddleware');

// typeDefs && resolvers
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Express and HTTP Server
const app = express();
const httpServer = createServer(app);

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
// Use for shutdown
const serverCleanup = useServer(
  { schema, context: contextMiddleware },
  wsServer
);

// Creating Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: contextMiddleware, // Context for Auth
  csrfPrevention: true,
  cache: 'bounded',
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }), // Shutdown HTTP
    {
      // Shutdown WebSocket
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
});

// Async Function to Start ApolloServer
async function startApolloServer(apolloServer) {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
}
startApolloServer(apolloServer);

const PORT = 4000;

httpServer.listen(PORT, function () {
  console.log(`Server on http://localhost:${PORT}${apolloServer.graphqlPath}`);

  sequelize
    .authenticate()
    .then(() => console.log('Database connected!!'))
    .catch((err) => console.log(err));
});
