import { HttpLink } from "@apollo/client";

// The real app: GraphQL over HTTP to the API, posters uploaded to it. (The demo build swaps this file, see vite.config.ts.)
export const DEMO = false;
export const link = new HttpLink({ uri: "/graphql", credentials: "same-origin" });

export async function uploadPoster(file: File): Promise<{ path: string; url: string }> {
  const form = new FormData();
  form.append("poster", file);
  const res = await fetch("/uploads/poster", { method: "POST", body: form, credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
  if (!res.ok || !json.path) throw new Error(json.error ?? "Upload failed. Try again.");
  return { path: json.path, url: `/uploads/${json.path}` };
}

export const resetDemo: (() => void) | null = null;
