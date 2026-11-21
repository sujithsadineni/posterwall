import { sql } from "drizzle-orm";
import { db } from "../db.ts";
import { users } from "../db/schema.ts";
import { hashPassword, verifyPassword } from "../auth/password.ts";
import { clearSession, setSession } from "../auth/session.ts";
import { logInInput, signUpInput } from "../auth/validate.ts";
import { badInput, fromZod, unauthenticated } from "./errors.ts";
import type { Context } from "./context.ts";

const publicUser = { id: users.id, username: users.username, createdAt: users.createdAt };
// verified against when the username doesn't exist, so both failures take about as long
const DUMMY_HASH = await hashPassword("not-a-real-password");

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: Context) => (ctx.userId ? ctx.loaders.user.load(ctx.userId) : null),
  },
  Mutation: {
    async signUp(_: unknown, args: { input: unknown }, ctx: Context) {
      const parsed = signUpInput.safeParse(args.input);
      if (!parsed.success) throw fromZod(parsed.error);
      const { username, email, password } = parsed.data;

      const [taken] = await db
        .select({ username: users.username, email: users.email })
        .from(users)
        .where(sql`lower(${users.username}) = lower(${username}) or lower(${users.email}) = lower(${email})`);
      if (taken?.username.toLowerCase() === username.toLowerCase())
        throw badInput("That username is taken", { username: "That username is taken" });
      if (taken)
        throw badInput("That email already has an account", { email: "That email already has an account" });

      const [user] = await db
        .insert(users)
        .values({ username, email, passwordHash: await hashPassword(password) })
        .returning(publicUser);
      await setSession(ctx.res, user.id);
      return user;
    },

    async logIn(_: unknown, args: { input: unknown }, ctx: Context) {
      const parsed = logInInput.safeParse(args.input);
      if (!parsed.success) throw unauthenticated("Wrong username or password");
      const { username, password } = parsed.data;
      const [user] = await db
        .select({ ...publicUser, passwordHash: users.passwordHash })
        .from(users)
        .where(sql`lower(${users.username}) = lower(${username})`);
      // one message for both cases: the response never says whether the username exists (v2 fix)
      const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) throw unauthenticated("Wrong username or password");
      await setSession(ctx.res, user.id);
      const { passwordHash: _hash, ...safe } = user;
      return safe;
    },

    logOut(_: unknown, __: unknown, ctx: Context) {
      clearSession(ctx.res);
      return true;
    },
  },
};
