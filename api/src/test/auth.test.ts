import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { client, code, resetDb, signUp, startApi, stopApi } from "./helpers.ts";

const ME = `{ me { id username } }`;
const LOGIN = `mutation($input: LogInInput!) { logIn(input: $input) { id username } }`;
const SIGNUP = `mutation($input: SignUpInput!) { signUp(input: $input) { id username } }`;

before(startApi);
after(stopApi);
beforeEach(resetDb);

describe("sign up", () => {
  test("creates the user and logs them in (httpOnly cookie)", async () => {
    const c = client();
    const user = await signUp(c, "alex");
    assert.equal(user.username, "alex");
    assert.match(c.setCookieHeader, /HttpOnly/i);
    assert.match(c.setCookieHeader, /SameSite=Lax/i);
    const me = await c.gql(ME);
    assert.equal(me.data.me.username, "alex");
  });

  test("rejects a username that differs only in capitals", async () => {
    await signUp(client(), "alex");
    const r = await client().gql(SIGNUP, {
      input: { username: "ALEX", email: "other@example.com", password: "password123" },
    });
    assert.equal(code(r), "BAD_USER_INPUT");
    assert.match(r.errors![0].message, /username is taken/i);
  });

  test("rejects an email that's already used", async () => {
    await signUp(client(), "alex");
    const r = await client().gql(SIGNUP, {
      input: { username: "sam", email: "ALEX@example.com", password: "password123" },
    });
    assert.equal(code(r), "BAD_USER_INPUT");
    assert.match(r.errors![0].message, /email/i);
  });

  test("validates input: short username, bad email, short password", async () => {
    const r = await client().gql(SIGNUP, { input: { username: "a", email: "nope", password: "short" } });
    assert.equal(code(r), "BAD_USER_INPUT");
    const fields = r.errors![0].extensions!.fields;
    assert.ok(fields.username && fields.email && fields.password, JSON.stringify(fields));
  });

  test("username may only use letters, numbers and _", async () => {
    const r = await client().gql(SIGNUP, {
      input: { username: "a b<script>", email: "x@example.com", password: "password123" },
    });
    assert.equal(code(r), "BAD_USER_INPUT");
  });
});

describe("log in / log out", () => {
  test("right password logs in (any capitals in the username)", async () => {
    await signUp(client(), "maya", "maya1234");
    const c = client();
    const r = await c.gql(LOGIN, { input: { username: "MAYA", password: "maya1234" } });
    assert.equal(r.data.logIn.username, "maya");
    assert.equal((await c.gql(ME)).data.me.username, "maya");
  });

  test("wrong password and unknown user give the SAME generic error", async () => {
    await signUp(client(), "maya", "maya1234");
    const wrong = await client().gql(LOGIN, { input: { username: "maya", password: "nope12345" } });
    const unknown = await client().gql(LOGIN, { input: { username: "ghost", password: "nope12345" } });
    assert.equal(code(wrong), "UNAUTHENTICATED");
    assert.equal(wrong.errors![0].message, "Wrong username or password");
    assert.equal(unknown.errors![0].message, wrong.errors![0].message);
  });

  test("log out clears the cookie and me becomes null", async () => {
    const c = client();
    await signUp(c, "sam");
    const r = await c.gql(`mutation { logOut }`);
    assert.equal(r.data.logOut, true);
    assert.equal(c.cookie, "");
    assert.equal((await c.gql(ME)).data.me, null);
  });

  test("me is null without a cookie, and with a forged one", async () => {
    assert.equal((await client().gql(ME)).data.me, null);
    // a token signed with some other secret
    const forged =
      "pw_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAifQ.c2lnbmVkLWVsc2V3aGVyZQ";
    assert.equal((await client(forged).gql(ME)).data.me, null);
  });
});

describe("the API never exposes password data", () => {
  test("User has no password field", async () => {
    const r = await client().gql(`{ __type(name: "User") { fields { name } } }`);
    const names = r.data.__type.fields.map((f: { name: string }) => f.name);
    assert.ok(!names.some((n: string) => /pass/i.test(n)), names.join());
  });
});
