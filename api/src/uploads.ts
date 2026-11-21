import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import express, { type ErrorRequestHandler, type Router } from "express";
import multer from "multer";
import { sessionUserId } from "./auth/session.ts";

// Poster images: POST /uploads/poster (multipart, field "poster", logged in) → { path }; GET /uploads/<path>.
// shortcut: files live on the API's disk, move to object storage (S3) before running more than one server.
export const uploadDir = resolve(process.env.UPLOAD_DIR ?? "uploads");
mkdirSync(uploadDir, { recursive: true });

const MAX_BYTES = 3 * 1024 * 1024;
export const POSTER_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

// what the bytes are, whatever the file name or browser says (SVG and everything else is refused)
function sniff(b: Buffer): "png" | "jpg" | "webp" | null {
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP")
    return "webp";
  return null;
}

export const posterExists = (path: string) => POSTER_PATH.test(path) && existsSync(join(uploadDir, path));

// best effort: a missing file is fine, a demo SVG poster is fine
export async function removePoster(path: string | null | undefined) {
  if (path && !path.includes("/") && !path.includes(".."))
    await unlink(join(uploadDir, path)).catch(() => {});
}

export function uploadRoutes(): Router {
  const router = express.Router();
  const accept = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
  }).single("poster");

  router.post("/poster", async (req, res, next) => {
    if (!(await sessionUserId(req))) return res.status(401).json({ error: "Log in first" });
    accept(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return res.status(400).json({ error: "Attach an image in the 'poster' field" });
      const ext = sniff(req.file.buffer);
      if (!ext) return res.status(415).json({ error: "Use a PNG, JPEG or WebP image" });
      const path = `${randomUUID()}.${ext}`;
      await writeFile(join(uploadDir, path), req.file.buffer);
      res.status(201).json({ path });
    });
  });

  // served as plain images: no sniffing, and nothing in them may run if opened directly
  router.use(
    express.static(uploadDir, {
      index: false,
      maxAge: "30d",
      immutable: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      },
    }),
  );

  const tooBig: ErrorRequestHandler = (err, _req, res, next) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE")
      return res.status(413).json({ error: "Images up to 3 MB" });
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    next(err);
  };
  router.use(tooBig);
  return router;
}
