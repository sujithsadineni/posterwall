import { test, expect, logIn, openPost } from "./fixtures";

const POSTER = new URL("./files/poster.png", import.meta.url).pathname;
const FAKE = new URL("./files/not-an-image.png", import.meta.url).pathname;

test.describe("the wall (logged out)", () => {
  test("posters, newest first, with movie, language, rating and counts; Load more", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PosterWall/);
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(8); // first page
    const first = cards.first();
    await expect(first).toContainText("RRR");
    await expect(first).toContainText("2022");
    await expect(first).toContainText("Telugu");
    await expect(first).toContainText("maya");
    await expect(first.getByRole("img", { name: "Poster for RRR" })).toBeVisible();
    await expect(first.getByRole("img", { name: "Rated 5 out of 5" })).toBeVisible();
    await expect(first.getByRole("button", { name: /like/i })).toContainText("3");
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(cards).toHaveCount(10);
  });

  test("filter by language, kept in the address", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Telugu" }).click();
    await expect(page).toHaveURL(/\?lang=telugu/);
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("article").filter({ hasText: "Baahubali" })).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole("radio", { name: "Telugu" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("radio", { name: "UK" }).click();
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("article").first()).toContainText("Paddington 2");
    await page.getByRole("radio", { name: "All" }).click();
    await expect(page.getByRole("article")).toHaveCount(8);
  });

  test("post page: poster, details and comments", async ({ page }) => {
    await openPost(page, "Interstellar");
    await expect(page.getByRole("img", { name: "Poster for Interstellar" })).toBeVisible();
    await expect(page.getByText("English · 2014")).toBeVisible();
    await expect(page.getByRole("img", { name: "Rated 5 out of 5" })).toBeVisible();
    await expect(page.getByText("Still thinking about the docking scene")).toBeVisible();
    await expect(page.getByText("The water planet scene still stresses me out.")).toBeVisible();
    await expect(page.getByText("Log in to comment")).toBeVisible();
  });

  test("share copies the post's link when the device has no share sheet", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
    await openPost(page, "Skyfall");
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByText("Link copied")).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(page.url());
  });

  test("liking while logged out goes to log in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("article").first().getByRole("button", { name: /like/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("profile shows that person's posters", async ({ page }) => {
    await page.goto("/u/alex");
    await expect(page.getByRole("heading", { level: 1, name: "alex" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(3);
  });

  test("unknown page and unknown post show a not-found message", async ({ page }) => {
    await page.goto("/nope");
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
    await page.goto("/p/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });
});

test.describe("accounts", () => {
  test("log in and log out", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: "Account menu for demo" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("wrong password shows one generic message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("demo");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toContainText("Wrong username or password");
  });

  test("sign up checks fields in the browser, then creates the account", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Username").fill("a");
    await page.getByLabel("Email").fill("nope");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("At least 3 characters")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await page.getByLabel("Username").fill("newbie");
    await page.getByLabel("Email").fill("newbie@example.com");
    await page.getByLabel("Password").fill("newbie1234");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Account menu for newbie" })).toBeVisible();
  });

  test("a taken username is reported on its field", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Username").fill("Demo");
    await page.getByLabel("Email").fill("another@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("That username is taken")).toBeVisible();
  });
});

test.describe("posting (logged in)", () => {
  test("like shows instantly, survives a reload, and can be undone", async ({ page }) => {
    await logIn(page, "sam", "sam12345");
    await page.goto("/?lang=uk");
    // Skyfall: only alex liked it in the seed
    const like = page
      .getByRole("article")
      .filter({ hasText: "Skyfall" })
      .getByRole("button", { name: /like/i });
    await expect(like).toContainText("1");
    await like.click();
    await expect(like).toContainText("2");
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(like).toContainText("2");
    await like.click();
    await expect(like).toContainText("1");
  });

  test("post a movie with an uploaded poster, edit it, delete it", async ({ page, consoleErrors }) => {
    await logIn(page);
    await page.getByRole("link", { name: "Post a movie" }).click();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Which movie?")).toBeVisible();
    await expect(page.getByText("Pick a language")).toBeVisible();

    await page.getByLabel("Movie", { exact: true }).fill("Ponniyin Selvan: I");
    await page.getByLabel("Year").fill("2022");
    await page.getByRole("radio", { name: "Tamil" }).check();
    await page.getByRole("radio", { name: "4 stars" }).check();
    await page.getByLabel("Poster image").setInputFiles(FAKE);
    await expect(page.getByText("Use a PNG, JPEG or WebP image")).toBeVisible();
    // Chrome logs the refused upload (415): expected here, and only here
    consoleErrors.splice(
      0,
      consoleErrors.length,
      ...consoleErrors.filter((e) => !e.includes("status of 415")),
    );
    await page.getByLabel("Poster image").setInputFiles(POSTER);
    await expect(page.getByRole("img", { name: "Poster preview" })).toBeVisible();
    await page.getByLabel("Headline").fill("Grand and gorgeous");
    await page.getByLabel("Your review").fill("Posted by Playwright.");
    await page.getByRole("button", { name: "Publish" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Ponniyin Selvan: I" })).toBeVisible();
    await expect(page.getByText("Tamil · 2022")).toBeVisible();
    await expect(page.getByRole("img", { name: "Rated 4 out of 5" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Poster for Ponniyin Selvan: I" })).toHaveAttribute(
      "src",
      /\/uploads\/[0-9a-f-]+\.png$/,
    );

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Headline").fill("Grand, gorgeous and long");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Grand, gorgeous and long")).toBeVisible();

    await page.goto("/?lang=tamil");
    await expect(page.getByRole("article").first()).toContainText("Ponniyin Selvan: I");
    await page
      .getByRole("article")
      .first()
      .getByRole("link", { name: "Ponniyin Selvan: I", exact: true })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Ponniyin Selvan: I")).toHaveCount(0);
  });

  test("no Edit/Delete on someone else's post", async ({ page }) => {
    await logIn(page);
    await openPost(page, "Paddington 2"); // alex's post, demo commented on it
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete comment" })).toHaveCount(1);
  });

  test("comment, then delete my comment", async ({ page }) => {
    await logIn(page, "maya", "maya1234");
    await openPost(page, "Oppenheimer");
    await page.getByLabel("Add a comment").fill("The sound design!");
    await page.getByRole("button", { name: "Comment" }).click();
    const mine = page.getByRole("listitem").filter({ hasText: "The sound design!" });
    await expect(mine).toBeVisible();
    await mine.getByRole("button", { name: "Delete comment" }).click();
    await expect(page.getByText("The sound design!")).toHaveCount(0);
  });
});

test.describe("look and access", () => {
  test("dark mode toggles and is remembered", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const wasDark = (await html.getAttribute("class"))?.includes("dark") ?? false;
    await page.getByRole("button", { name: /switch to (dark|light) theme/i }).click();
    await expect(html).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
    await page.reload();
    await expect(html).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
  });

  test("every button, link and image has a name; no sideways scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article").first()).toBeVisible();
    const unnamed = await page.evaluate(() => [
      ...[...document.querySelectorAll("button, a[href]")]
        .filter((el) => !(el.getAttribute("aria-label") || el.textContent?.trim()))
        .map((el) => el.outerHTML.slice(0, 80)),
      ...[...document.querySelectorAll("img:not([alt])")].map((el) => el.outerHTML.slice(0, 80)),
    ]);
    expect(unnamed).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
