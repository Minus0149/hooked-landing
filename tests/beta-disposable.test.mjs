// node --experimental-strip-types --test tests/beta-disposable.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DISPOSABLE_EMAIL, isCommonDisposable, validateSignup } from "../src/data/beta.ts";
import { serverError } from "../src/data/betaCopy.ts";
import { isDisposableAnswer } from "../src/lib/betaAnswer.ts";

// Temporary inboxes can't join. The backend holds the full list and decides;
// the landing shows its answer in words, in English and Hindi.

test("the commonest throwaway domains are caught before the round trip", () => {
  assert.equal(isCommonDisposable("a@mailinator.com"), true);
  assert.equal(isCommonDisposable("a@MX.Mailinator.com"), true); // subdomain
  assert.equal(isCommonDisposable("a@yopmail.com."), true);
  assert.equal(isCommonDisposable("a@gmail.com"), false);
  assert.equal(isCommonDisposable("a@notmailinator.com"), false);
  assert.equal(validateSignup({ email: "x@guerrillamail.com" }).errors.email, DISPOSABLE_EMAIL);
  assert.deepEqual(validateSignup({ email: "x@gmail.com" }).errors, {});
});

test("the backend's 422 disposable answer is recognised, other 422s aren't", async () => {
  const res = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  assert.equal(await isDisposableAnswer(res(422, { ok: false, error: "disposable", message: "x" })), true);
  assert.equal(await isDisposableAnswer(res(422, { ok: false, error: "other" })), false);
  assert.equal(await isDisposableAnswer(new Response("invalid signup", { status: 422 })), false);
  assert.equal(await isDisposableAnswer(res(400, { error: "disposable" })), false);
});

test("the route turns it into a field error, not 'our end broke'", () => {
  const route = readFileSync(new URL("../src/app/api/beta/route.ts", import.meta.url), "utf8");
  const store = route.slice(route.indexOf("async function store"));
  assert.ok(store.indexOf("isDisposableAnswer(res)") < store.indexOf("if (!res.ok) throw"));
  assert.match(route, /errors: \{ email: DISPOSABLE_EMAIL \}, message: DISPOSABLE_EMAIL \}, 400/);
});

test("the /hi page says it in Hindi", () => {
  const hi = serverError("hi", DISPOSABLE_EMAIL);
  assert.notEqual(hi, DISPOSABLE_EMAIL);
  assert.match(hi, /email/);
  assert.equal(serverError("en", DISPOSABLE_EMAIL), DISPOSABLE_EMAIL);
  const form = readFileSync(new URL("../src/components/BetaForm.tsx", import.meta.url), "utf8");
  assert.equal((form.match(/serverError\(lang, data\.message\)/g) ?? []).length, 2);
});
