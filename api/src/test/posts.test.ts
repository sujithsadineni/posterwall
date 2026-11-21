import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { client, code, resetDb, signUp, startApi, stopApi } from "./helpers.ts";

const POST_FIELDS = `id title body movieTitle releaseYear language rating posterUrl author { username } likeCount likedByMe commentCount createdAt updatedAt`;
const MOVIE = { movieTitle: "Interstellar", releaseYear: 2014, language: "ENGLISH", rating: 5 };
const CREATE = `mutation($input: PostInput!) { createPost(input: $input) { ${POST_FIELDS} } }`;
const UPDATE = `mutation($id: ID!, $input: PostInput!) { updatePost(id: $id, input: $input) { ${POST_FIELDS} } }`;
const DELETE = `mutation($id: ID!) { deletePost(id: $id) }`;
const POST = `query($id: ID!) { post(id: $id) { ${POST_FIELDS} comments { id body author { username } } } }`;
const FEED = `query($first: Int, $after: String) { feed(first: $first, after: $after) { nodes { id title author { username } likeCount commentCount } nextCursor } }`;
const LIKE = `mutation($postId: ID!) { toggleLike(postId: $postId) { id likeCount likedByMe } }`;
const COMMENT = `mutation($postId: ID!, $body: String!) { addComment(postId: $postId, body: $body) { id body author { username } } }`;
const DEL_COMMENT = `mutation($id: ID!) { deleteComment(id: $id) }`;

before(startApi);
after(stopApi);
beforeEach(resetDb);

async function author(name = "alex") {
  const c = client();
  await signUp(c, name);
  return c;
}
async function newPost(c: ReturnType<typeof client>, title = "Hello", body = "First post") {
  const r = await c.gql(CREATE, { input: { ...MOVIE, title, body } });
  if (r.errors) throw new Error(JSON.stringify(r.errors));
  return r.data.createPost;
}

describe("posts", () => {
  test("logged-in user creates a post; anyone can read it", async () => {
    const alex = await author();
    const p = await newPost(alex, "Hello", "World");
    assert.equal(p.author.username, "alex");
    assert.equal(p.likeCount, 0);
    const r = await client().gql(POST, { id: p.id });
    assert.equal(r.data.post.title, "Hello");
    assert.equal(r.data.post.likedByMe, false);
  });

  test("creating a post needs a login (v1 let anyone post)", async () => {
    const r = await client().gql(CREATE, { input: { ...MOVIE, title: "x", body: "y" } });
    assert.equal(code(r), "UNAUTHENTICATED");
  });

  test("title and body are validated and trimmed", async () => {
    const alex = await author();
    const empty = await alex.gql(CREATE, { input: { ...MOVIE, title: "   ", body: "" } });
    assert.equal(code(empty), "BAD_USER_INPUT");
    assert.ok(empty.errors![0].extensions!.fields.title && empty.errors![0].extensions!.fields.body);
    const long = await alex.gql(CREATE, { input: { ...MOVIE, title: "x".repeat(121), body: "y" } });
    assert.equal(code(long), "BAD_USER_INPUT");
    const p = await newPost(alex, "  Spaced  ", "  body  ");
    assert.equal(p.title, "Spaced");
  });

  test("only the author can edit; edit moves updatedAt", async () => {
    const alex = await author();
    const sam = await author("sam");
    const p = await newPost(alex);
    const notMine = await sam.gql(UPDATE, { id: p.id, input: { ...MOVIE, title: "Hacked", body: "x" } });
    assert.equal(code(notMine), "FORBIDDEN");
    const anon = await client().gql(UPDATE, { id: p.id, input: { ...MOVIE, title: "Hacked", body: "x" } });
    assert.equal(code(anon), "UNAUTHENTICATED");
    const mine = await alex.gql(UPDATE, { id: p.id, input: { ...MOVIE, title: "Edited", body: "Better" } });
    assert.equal(mine.data.updatePost.title, "Edited");
    assert.ok(new Date(mine.data.updatePost.updatedAt) > new Date(p.updatedAt));
  });

  test("only the author can delete; comments and likes go with it", async () => {
    const alex = await author();
    const sam = await author("sam");
    const p = await newPost(alex);
    await sam.gql(COMMENT, { postId: p.id, body: "nice" });
    await sam.gql(LIKE, { postId: p.id });
    assert.equal(code(await sam.gql(DELETE, { id: p.id })), "FORBIDDEN");
    assert.equal((await alex.gql(DELETE, { id: p.id })).data.deletePost, true);
    assert.equal((await client().gql(POST, { id: p.id })).data.post, null);
  });

  test("unknown or malformed ids: post is null, mutations say NOT_FOUND / BAD_USER_INPUT", async () => {
    const alex = await author();
    assert.equal((await client().gql(POST, { id: "00000000-0000-4000-8000-000000000000" })).data.post, null);
    assert.equal(code(await client().gql(POST, { id: "not-a-uuid" })), "BAD_USER_INPUT");
    assert.equal(code(await alex.gql(DELETE, { id: "00000000-0000-4000-8000-000000000000" })), "NOT_FOUND");
  });
});

describe("feed", () => {
  test("newest first, paged with a cursor, no gaps or repeats", async () => {
    const alex = await author();
    for (let i = 1; i <= 5; i++) await newPost(alex, `Post ${i}`);
    const page1 = await client().gql(FEED, { first: 2 });
    assert.deepEqual(
      page1.data.feed.nodes.map((n: any) => n.title),
      ["Post 5", "Post 4"],
    );
    const page2 = await client().gql(FEED, { first: 2, after: page1.data.feed.nextCursor });
    assert.deepEqual(
      page2.data.feed.nodes.map((n: any) => n.title),
      ["Post 3", "Post 2"],
    );
    const page3 = await client().gql(FEED, { first: 2, after: page2.data.feed.nextCursor });
    assert.deepEqual(
      page3.data.feed.nodes.map((n: any) => n.title),
      ["Post 1"],
    );
    assert.equal(page3.data.feed.nextCursor, null);
  });

  test("page size is capped and a bad cursor is rejected", async () => {
    const big = await client().gql(FEED, { first: 1000 });
    assert.equal(code(big), "BAD_USER_INPUT");
    const bad = await client().gql(FEED, { after: "garbage" });
    assert.equal(code(bad), "BAD_USER_INPUT");
  });

  test("counts are right for every post on a page", async () => {
    const alex = await author();
    const sam = await author("sam");
    const maya = await author("maya");
    const a = await newPost(alex, "A");
    const b = await newPost(alex, "B");
    await sam.gql(LIKE, { postId: a.id });
    await maya.gql(LIKE, { postId: a.id });
    await sam.gql(COMMENT, { postId: b.id, body: "one" });
    await maya.gql(COMMENT, { postId: b.id, body: "two" });
    await maya.gql(COMMENT, { postId: b.id, body: "three" });
    const feed = (await client().gql(FEED, {})).data.feed.nodes;
    const byTitle = Object.fromEntries(feed.map((n: any) => [n.title, n]));
    assert.equal(byTitle.A.likeCount, 2);
    assert.equal(byTitle.A.commentCount, 0);
    assert.equal(byTitle.B.likeCount, 0);
    assert.equal(byTitle.B.commentCount, 3);
  });
});

describe("likes", () => {
  test("toggle: like, then unlike; likedByMe follows the viewer", async () => {
    const alex = await author();
    const sam = await author("sam");
    const p = await newPost(alex);
    const on = await sam.gql(LIKE, { postId: p.id });
    assert.deepEqual([on.data.toggleLike.likeCount, on.data.toggleLike.likedByMe], [1, true]);
    const seenByAlex = await alex.gql(POST, { id: p.id });
    assert.deepEqual([seenByAlex.data.post.likeCount, seenByAlex.data.post.likedByMe], [1, false]);
    const off = await sam.gql(LIKE, { postId: p.id });
    assert.deepEqual([off.data.toggleLike.likeCount, off.data.toggleLike.likedByMe], [0, false]);
  });

  test("two likes at the same moment still count once", async () => {
    const alex = await author();
    const sam = await author("sam");
    const p = await newPost(alex);
    // the like→unlike toggle is decided by the database, so racing requests can't double count
    await Promise.all([sam.gql(LIKE, { postId: p.id }), sam.gql(LIKE, { postId: p.id })]);
    const r = await client().gql(POST, { id: p.id });
    assert.ok([0, 1].includes(r.data.post.likeCount), String(r.data.post.likeCount));
  });

  test("liking needs a login", async () => {
    const p = await newPost(await author());
    assert.equal(code(await client().gql(LIKE, { postId: p.id })), "UNAUTHENTICATED");
  });
});

describe("comments", () => {
  test("add (trimmed, oldest first) and only the comment's author can delete it", async () => {
    const alex = await author();
    const sam = await author("sam");
    const p = await newPost(alex);
    const c1 = (await sam.gql(COMMENT, { postId: p.id, body: "  first  " })).data.addComment;
    await alex.gql(COMMENT, { postId: p.id, body: "second" });
    assert.equal(c1.body, "first");
    const r = await client().gql(POST, { id: p.id });
    assert.deepEqual(
      r.data.post.comments.map((c: any) => c.body),
      ["first", "second"],
    );
    assert.equal(r.data.post.commentCount, 2);
    assert.equal(code(await alex.gql(DEL_COMMENT, { id: c1.id })), "FORBIDDEN");
    assert.equal((await sam.gql(DEL_COMMENT, { id: c1.id })).data.deleteComment, true);
  });

  test("empty comment and anonymous comment are refused", async () => {
    const alex = await author();
    const p = await newPost(alex);
    assert.equal(code(await alex.gql(COMMENT, { postId: p.id, body: "   " })), "BAD_USER_INPUT");
    assert.equal(code(await client().gql(COMMENT, { postId: p.id, body: "hi" })), "UNAUTHENTICATED");
  });

  test("commenting on a missing post says NOT_FOUND", async () => {
    const alex = await author();
    assert.equal(
      code(await alex.gql(COMMENT, { postId: "00000000-0000-4000-8000-000000000000", body: "hi" })),
      "NOT_FOUND",
    );
  });
});

describe("profiles", () => {
  test("a user's posts, newest first", async () => {
    const alex = await author();
    await newPost(alex, "Old");
    await newPost(alex, "New");
    await newPost(await author("sam"), "Not alex");
    const r = await client().gql(`query { user(username: "ALEX") { username posts { title } } }`);
    assert.equal(r.data.user.username, "alex");
    assert.deepEqual(
      r.data.user.posts.map((p: any) => p.title),
      ["New", "Old"],
    );
    assert.equal((await client().gql(`query { user(username: "ghost") { username } }`)).data.user, null);
  });
});

describe("no N+1 queries", () => {
  test("a 10-post feed page with authors and counts runs a fixed number of SQL queries", async () => {
    const { pool } = await import("../db.ts");
    const people = [await author("alex"), await author("sam"), await author("maya")];
    for (let i = 0; i < 10; i++) {
      const p = await newPost(people[i % 3], `P${i}`);
      await people[(i + 1) % 3].gql(LIKE, { postId: p.id });
      await people[(i + 2) % 3].gql(COMMENT, { postId: p.id, body: "hi" });
    }
    const viewer = people[0];
    let queries = 0;
    const real = pool.query.bind(pool);
    (pool as any).query = (...args: any[]) => (queries++, (real as any)(...args));
    try {
      const r = await viewer.gql(
        `{ feed(first: 10) { nodes { title author { username } likeCount likedByMe commentCount } } }`,
      );
      assert.equal(r.data.feed.nodes.length, 10);
    } finally {
      (pool as any).query = real;
    }
    // feed + authors + like counts + my likes + comment counts = 5, whatever the page size (v1-style: 1 + 10×4)
    assert.equal(queries, 5);
  });
});
