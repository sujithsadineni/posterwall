import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("hash verifies the right password only", async () => {
  const stored = await hashPassword("demo1234");
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(await verifyPassword("demo1234", stored), true);
  assert.equal(await verifyPassword("demo1235", stored), false);
});

test("same password, different salt, different hash", async () => {
  assert.notEqual(await hashPassword("x"), await hashPassword("x"));
});

test("malformed stored value is rejected, not thrown", async () => {
  assert.equal(await verifyPassword("x", "bcrypt$abc"), false);
  assert.equal(await verifyPassword("x", ""), false);
});
