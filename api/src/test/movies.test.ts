import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { apiBase, client, code, resetDb, signUp, startApi, stopApi } from "./helpers.ts";

const FIELDS = `id movieTitle releaseYear language rating posterUrl title`;
const CREATE = `mutation($input: PostInput!) { createPost(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation($id: ID!, $input: PostInput!) { updatePost(id: $id, input: $input) { ${FIELDS} } }`;
const FEED = `query($language: Language, $first: Int, $after: String) { feed(language: $language, first: $first, after: $after) { nodes { movieTitle language } nextCursor } }`;
const base = {
  movieTitle: "RRR",
  releaseYear: 2022,
  language: "TELUGU",
  rating: 5,
  title: "Naatu Naatu!",
  body: "Loved it.",
};

// smallest valid images (magic bytes are what the server checks)
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a1c5a9d40000000049454e44ae426082",
  "hex",
);
const JPEG = Buffer.concat([
  Buffer.from("ffd8ffe000104a46494600010100000100010000", "hex"),
  Buffer.alloc(32),
  Buffer.from("ffd9", "hex"),
]);

async function upload(cookie: string, bytes: Buffer, type = "image/png", name = "poster.png") {
  const form = new FormData();
  form.append("poster", new Blob([new Uint8Array(bytes)], { type }), name);
  const res = await fetch(`${apiBase().replace(/\/graphql$/, "")}/uploads/poster`, {
    method: "POST",
    body: form,
    headers: cookie ? { cookie } : {},
  });
  return {
    status: res.status,
    body: (await res.json().catch(() => ({}))) as { path?: string; error?: string },
  };
}
const uploadDir = () => process.env.UPLOAD_DIR!;

before(startApi);
after(stopApi);
beforeEach(resetDb);

describe("movie fields", () => {
  test("a post is about a movie: title, year, language, rating", async () => {
    const c = client();
    await signUp(c, "sam");
    const p = (await c.gql(CREATE, { input: base })).data.createPost;
    assert.deepEqual(
      [p.movieTitle, p.releaseYear, p.language, p.rating, p.posterUrl],
      ["RRR", 2022, "TELUGU", 5, null],
    );
  });

  test("year and rating are optional", async () => {
    const c = client();
    await signUp(c, "sam");
    const p = (await c.gql(CREATE, { input: { ...base, releaseYear: null, rating: null } })).data.createPost;
    assert.deepEqual([p.releaseYear, p.rating], [null, null]);
  });

  test("bad values are refused: unknown language, rating 0 or 6, impossible year, empty movie title", async () => {
    const c = client();
    await signUp(c, "sam");
    for (const input of [
      { ...base, language: "KLINGON" },
      { ...base, rating: 0 },
      { ...base, rating: 6 },
      { ...base, releaseYear: 1700 },
      { ...base, releaseYear: 3000 },
      { ...base, movieTitle: "  " },
    ]) {
      const r = await c.gql(CREATE, { input });
      assert.equal(code(r), "BAD_USER_INPUT", JSON.stringify(input));
    }
  });

  test("all five languages are accepted", async () => {
    const c = client();
    await signUp(c, "sam");
    for (const language of ["ENGLISH", "UK", "HINDI", "TELUGU", "TAMIL"]) {
      const r = await c.gql(CREATE, { input: { ...base, language } });
      assert.equal(r.data?.createPost.language, language, JSON.stringify(r.errors));
    }
  });
});

describe("feed by language", () => {
  test("filters to one language and pages within it", async () => {
    const c = client();
    await signUp(c, "sam");
    for (const [movieTitle, language] of [
      ["A", "TELUGU"],
      ["B", "TAMIL"],
      ["C", "TELUGU"],
      ["D", "HINDI"],
      ["E", "TELUGU"],
    ])
      await c.gql(CREATE, { input: { ...base, movieTitle, language } });
    const p1 = (await client().gql(FEED, { language: "TELUGU", first: 2 })).data.feed;
    assert.deepEqual(
      p1.nodes.map((n: any) => n.movieTitle),
      ["E", "C"],
    );
    const p2 = (await client().gql(FEED, { language: "TELUGU", first: 2, after: p1.nextCursor })).data.feed;
    assert.deepEqual(
      p2.nodes.map((n: any) => n.movieTitle),
      ["A"],
    );
    assert.equal(p2.nextCursor, null);
    const all = (await client().gql(FEED, {})).data.feed.nodes;
    assert.equal(all.length, 5);
  });
});

describe("poster uploads", () => {
  test("needs a login", async () => {
    const r = await upload("", PNG);
    assert.equal(r.status, 401);
  });

  test("PNG and JPEG are stored and served back with the right type", async () => {
    const c = client();
    await signUp(c, "sam");
    for (const [bytes, type, ext] of [
      [PNG, "image/png", "png"],
      [JPEG, "image/jpeg", "jpg"],
    ] as const) {
      const r = await upload(c.cookie, bytes, type, `x.${ext}`);
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.match(r.body.path!, new RegExp(`^[0-9a-f-]{36}\\.${ext}$`));
      const served = await fetch(`${apiBase().replace(/\/graphql$/, "")}/uploads/${r.body.path}`);
      assert.equal(served.status, 200);
      assert.equal(served.headers.get("content-type"), type);
      assert.equal(served.headers.get("x-content-type-options"), "nosniff");
    }
  });

  test("the file's real bytes decide, not its name or claimed type", async () => {
    const c = client();
    await signUp(c, "sam");
    const fake = await upload(c.cookie, Buffer.from("<script>alert(1)</script>"), "image/png", "evil.png");
    assert.equal(fake.status, 415);
    const svg = await upload(
      c.cookie,
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      "image/svg+xml",
      "x.svg",
    );
    assert.equal(svg.status, 415);
  });

  test("files over 3 MB are refused", async () => {
    const c = client();
    await signUp(c, "sam");
    const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024 + 1)]);
    assert.equal((await upload(c.cookie, big)).status, 413);
  });

  test("a post shows its uploaded poster; bad or unknown poster paths are refused", async () => {
    const c = client();
    await signUp(c, "sam");
    const { path } = (await upload(c.cookie, PNG)).body;
    const p = (await c.gql(CREATE, { input: { ...base, posterPath: path } })).data.createPost;
    assert.equal(p.posterUrl, `/uploads/${path}`);
    assert.equal(
      code(await c.gql(CREATE, { input: { ...base, posterPath: "../../etc/passwd" } })),
      "BAD_USER_INPUT",
    );
    assert.equal(
      code(
        await c.gql(CREATE, { input: { ...base, posterPath: "00000000-0000-4000-8000-000000000000.png" } }),
      ),
      "BAD_USER_INPUT",
    );
  });

  test("replacing or deleting a post removes its old poster file", async () => {
    const c = client();
    await signUp(c, "sam");
    const first = (await upload(c.cookie, PNG)).body.path!;
    const second = (await upload(c.cookie, PNG)).body.path!;
    const p = (await c.gql(CREATE, { input: { ...base, posterPath: first } })).data.createPost;
    await c.gql(UPDATE, { id: p.id, input: { ...base, posterPath: second } });
    assert.equal(existsSync(join(uploadDir(), first)), false);
    assert.equal(existsSync(join(uploadDir(), second)), true);
    await c.gql(`mutation($id: ID!) { deletePost(id: $id) }`, { id: p.id });
    assert.equal(existsSync(join(uploadDir(), second)), false);
  });
});
