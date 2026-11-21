import { readFileSync } from "node:fs";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { GraphQLScalarType, Kind } from "graphql";
import { pool } from "./db.ts";
import { buildContext, type Context } from "./graphql/context.ts";
import { authResolvers } from "./graphql/auth.ts";
import { postResolvers } from "./graphql/posts.ts";
import { uploadRoutes } from "./uploads.ts";

const typeDefs = readFileSync(new URL("./schema.graphql", import.meta.url), "utf8");

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO 8601 date-time string",
  serialize: (v) => (v instanceof Date ? v.toISOString() : String(v)),
  parseValue: (v) => new Date(String(v)),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

const health = async () => ({
  api: true,
  database: await pool
    .query("select 1")
    .then(() => true)
    .catch(() => false),
});

export async function createApp() {
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers: [{ DateTime, Query: { health } }, authResolvers, postResolvers],
    // Apollo's CSRF prevention stays on (default): plain cross-site form posts are refused
  });
  await server.start();

  const app = express();
  app.disable("x-powered-by");
  // the web app reaches this through Vite's proxy (same origin), so no CORS setup is needed
  app.use("/uploads", uploadRoutes());
  app.use("/graphql", express.json({ limit: "100kb" }), expressMiddleware(server, { context: buildContext }));
  return app;
}
