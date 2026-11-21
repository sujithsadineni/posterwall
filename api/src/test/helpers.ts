import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { db, pool } from "../db.ts";
import { createApp } from "../app.ts";

// One running API per test file, a real HTTP client with a cookie jar per "browser".

let server: Server | undefined;
let base = "";

export async function startApi() {
  if (process.env.NODE_ENV !== "test") throw new Error("tests must run with .env.test");
  await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
  const app = await createApp();
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/graphql`;
}

export const apiBase = () => base;

export async function stopApi() {
  await new Promise((r) => server?.close(r));
  await pool.end();
}

export async function resetDb() {
  await db.execute(sql`truncate likes, comments, posts, users cascade`);
}

export type GqlResult<T = any> = {
  data?: T;
  errors?: { message: string; extensions?: Record<string, any> }[];
};

// A browser: keeps the session cookie between requests, like a real one.
export function client(initialCookie = "") {
  let cookie = initialCookie;
  const c = {
    setCookieHeader: "",
    async gql<T = any>(query: string, variables?: Record<string, unknown>): Promise<GqlResult<T>> {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie && { cookie }) },
        body: JSON.stringify({ query, variables }),
      });
      const set = res.headers.get("set-cookie");
      if (set) {
        c.setCookieHeader = set;
        const pair = set.split(";")[0];
        cookie = pair.endsWith("=") ? "" : pair; // cleared cookie → forget it
      }
      return res.json() as Promise<GqlResult<T>>;
    },
    get cookie() {
      return cookie;
    },
  };
  return c;
}

export const code = (r: GqlResult) => r.errors?.[0]?.extensions?.code;

export async function signUp(c: ReturnType<typeof client>, username: string, password = "password123") {
  const r = await c.gql(`mutation($input: SignUpInput!) { signUp(input: $input) { id username } }`, {
    input: { username, email: `${username}@example.com`, password },
  });
  if (r.errors) throw new Error(JSON.stringify(r.errors));
  return r.data.signUp as { id: string; username: string };
}
