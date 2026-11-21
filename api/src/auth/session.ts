import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";

// Session = a signed JWT (jose, HS256) in an httpOnly cookie: page scripts can't read it (v1 kept it in localStorage).
export const COOKIE = "pw_session";
const MAX_AGE_S = 7 * 24 * 3600;

const secretText = process.env.JWT_SECRET;
if (!secretText || secretText.length < 32)
  throw new Error("JWT_SECRET must be set, 32+ characters (see api/.env.example)");
const secret = new TextEncoder().encode(secretText);

export async function setSession(res: Response, userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(secret);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
}

// The user id in a valid, unexpired token; null for anything else (missing, forged, expired).
export async function sessionUserId(req: Request): Promise<string | null> {
  const token = readCookie(req.headers.cookie, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of header?.split(";") ?? []) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
}
