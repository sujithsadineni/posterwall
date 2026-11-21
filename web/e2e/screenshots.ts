// Screenshots for the README (PosterWall): `node web/e2e/screenshots.ts` with the dev servers running (seeded data).
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:5180";
const OUT = new URL("../../docs/screenshots/", import.meta.url).pathname;

const browser = await chromium.launch({ channel: "chrome" });
for (const [name, theme, viewport] of [
  ["desktop-light", "light", { width: 1280, height: 900 }],
  ["desktop-dark", "dark", { width: 1280, height: 900 }],
  ["phone-light", "light", { width: 390, height: 844 }],
] as const) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.getByRole("article").first().waitFor();
  await page.waitForTimeout(800); // let the cards finish fading in
  await page.screenshot({ path: `${OUT}feed-${name}.png` });
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("button", { name: "Account menu for demo" }).waitFor();
  await page.getByRole("article").first().waitFor();
  await page.waitForTimeout(4600); // cards fade in, the welcome toast leaves
  await page.screenshot({ path: `${OUT}feed-logged-in-${name}.png` });
  await page.getByRole("link", { name: "RRR", exact: true }).click();
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}post-${name}.png`, fullPage: true });
  await page.goto(`${BASE}/write`);
  await page.getByLabel("Headline").waitFor();
  await page.screenshot({ path: `${OUT}write-${name}.png` });
  await ctx.close();
}
await browser.close();
console.log("screenshots saved to docs/screenshots/");
