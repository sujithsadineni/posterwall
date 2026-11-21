import type { Request, Response } from "express";
import { sessionUserId } from "../auth/session.ts";
import { createLoaders } from "./loaders.ts";

export type Context = {
  userId: string | null;
  req: Request;
  res: Response;
  loaders: ReturnType<typeof createLoaders>;
};

export async function buildContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const userId = await sessionUserId(req);
  return { userId, req, res, loaders: createLoaders(userId) };
}
