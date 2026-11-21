import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (copy api/.env.example to api/.env)");

export const pool = new pg.Pool({ connectionString: url });
export const db = drizzle(pool, { schema, casing: "snake_case" });
