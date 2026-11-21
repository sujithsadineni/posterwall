import { existsSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";

const POSTER = new URL("../e2e/files/poster.png", import.meta.url).pathname;

// every test starts with a fresh demo (empty browser storage) and fails on console errors
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

async function logIn(page: Page, username = "demo", password = "demo1234") {
  await page.goto("login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: `Account menu for ${username}` })).toBeVisible();
}

test("the wall works with no server: posters, banner, language filter", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/PosterWall/);
  await expect(page.getByText(/demo/i).first()).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect(page.getByRole("article").first().getByRole("img", { name: "Poster for RRR" })).toBeVisible();
  await page.getByRole("radio", { name: "Telugu" }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByRole("button", { name: "Load more" }).count(); // none expected for 2
  await page.getByRole("radio", { name: "All" }).click();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("opening a movie from far down the wall starts at the top of its page", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Load more" }).click();
  await page.getByRole("link", { name: "Oppenheimer", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Oppenheimer" })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("a movie page opens directly from its link (deep link)", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Vikram", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Vikram" })).toBeVisible();
  const url = page.url();
  expect(url).toContain("/posterwall/p/");
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1, name: "Vikram" })).toBeVisible();
  await expect(page.getByText("The background score carries every fight.")).toBeVisible();
});

test("GitHub Pages fallback page exists for deep links", () => {
  expect(existsSync(new URL("../dist-demo/404.html", import.meta.url).pathname)).toBe(true);
});

test("log in, like, comment: kept after a reload", async ({ page }) => {
  await logIn(page, "sam", "sam12345");
  await page.goto("./?lang=uk");
  const like = page
    .getByRole("article")
    .filter({ hasText: "Skyfall" })
    .getByRole("button", { name: /like/i });
  await expect(like).toContainText("1");
  await like.click();
  await expect(like).toContainText("2");
  await page.reload();
  await expect(like).toContainText("2");
  await page.getByRole("link", { name: "Skyfall", exact: true }).click();
  await page.getByLabel("Add a comment").fill("Adele's song!");
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Adele's song!")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Adele's song!")).toBeVisible();
});

test("wrong password and a taken username behave like the real app", async ({ page }) => {
  await page.goto("login");
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("nope12345");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toContainText("Wrong username or password");
  await page.goto("signup");
  await page.getByLabel("Username").fill("DEMO");
  await page.getByLabel("Email").fill("x@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("That username is taken")).toBeVisible();
});

test("post a movie with my own poster; it stays after a reload; Reset demo clears it", async ({ page }) => {
  await logIn(page);
  await page.getByRole("link", { name: "Post a movie" }).click();
  await page.getByLabel("Movie", { exact: true }).fill("Kantara");
  await page.getByLabel("Year").fill("2022");
  await page.getByRole("radio", { name: "Hindi" }).check();
  await page.getByRole("radio", { name: "5 stars" }).check();
  await page.getByLabel("Poster image").setInputFiles(POSTER);
  await expect(page.getByRole("img", { name: "Poster preview" })).toBeVisible();
  await page.getByLabel("Headline").fill("Made in the demo");
  await page.getByLabel("Your review").fill("Stored in this browser only.");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kantara" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Poster for Kantara" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Kantara" })).toBeVisible();

  await page.goto("./");
  await expect(page.getByRole("article").first()).toContainText("Kantara");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("article").first()).toContainText("RRR");
  await expect(page.getByText("Kantara")).toHaveCount(0);
});

test("share link points at the Pages address", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await page.goto("./");
  await page.getByRole("article").first().getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /\/posterwall\/p\/[0-9a-f-]{36}$/,
  );
});

test("no sideways scroll, every control named", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("article").first()).toBeVisible();
  const unnamed = await page.evaluate(
    () =>
      [...document.querySelectorAll("button, a[href], img")].filter(
        (el) => !(el.getAttribute("aria-label") || el.getAttribute("alt") || el.textContent?.trim()),
      ).length,
  );
  expect(unnamed).toBe(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false);
});
