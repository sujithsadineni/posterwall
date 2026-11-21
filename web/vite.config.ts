import { copyFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves 404.html for any unknown path; making it the app lets deep links (/posterwall/p/…) load.
const pagesFallback = (): Plugin => ({
  name: "pages-404-fallback",
  apply: "build",
  writeBundle(options) {
    copyFileSync(path.join(options.dir!, "index.html"), path.join(options.dir!, "404.html"));
  },
});

export default defineConfig(({ mode }) => {
  const demo = mode === "demo"; // the GitHub Pages build: no API, GraphQL runs in the browser
  return {
    base: demo ? "/posterwall/" : "/",
    plugins: [react(), tailwindcss(), ...(demo ? [pagesFallback()] : [])],
    resolve: {
      alias: [
        // one module decides how the app talks to "the server": HTTP, or the in-browser demo
        {
          find: "@/lib/transport",
          replacement: path.resolve(
            import.meta.dirname,
            demo ? "src/demo/transport.ts" : "src/lib/transport.ts",
          ),
        },
        { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      ],
    },
    server: {
      port: 5180,
      fs: { allow: [".."] }, // the demo imports the API's schema and seed data
      // same origin for the browser: no CORS, and the session cookie just works
      proxy: {
        "/graphql": process.env.API_URL ?? "http://127.0.0.1:4100",
        "/uploads": process.env.API_URL ?? "http://127.0.0.1:4100",
      },
    },
  };
});
