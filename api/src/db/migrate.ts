import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db.ts";

// applies the SQL files in api/drizzle/ that haven't run yet (tracked by Drizzle in the database)
await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
console.log("migrations applied");
await pool.end();
