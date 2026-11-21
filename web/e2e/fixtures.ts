import { execSync } from "node:child_process";
import { test as base, expect, type Page } from "@playwright/test";

// Every test starts from the same seed (4 users, 8 posts) and fails on any console error.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      execSync("npm run db:seed -w api", {
        cwd: "..",
        stdio: "ignore",
        env: {
          ...process.env,
          DATABASE_URL: "postgres://localhost:5432/posterwall_e2e",
          NODE_ENV: "test",
          UPLOAD_DIR: "uploads-e2e",
        },
      });
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function logIn(page: Page, username = "demo", password = `${username}1234`) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: `Account menu for ${username}` })).toBeVisible();
}

// open a post from the feed, paging with "Load more" until its title shows up
export async function openPost(page: Page, movie: string) {
  const title = movie;
  await page.goto("/");
  const link = page.getByRole("link", { name: title, exact: true });
  const more = page.getByRole("button", { name: "Load more" });
  await expect(page.getByRole("article").first()).toBeVisible();
  while (!(await link.isVisible()) && (await more.isVisible())) await more.click();
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}
