// node --experimental-strip-types --test tests/beta-form.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  GENRES,
  LIMITS,
  hasDetails,
  nameFromEmail,
  toggleChip,
  validateDetails,
  validateSignup,
} from "../src/data/beta.ts";

// Step one is just the address. It used to be eleven fields and a checkbox.

test("an email alone is a complete signup", () => {
  const { data, errors } = validateSignup({ email: "  Sam.K@Gmail.com " });
  assert.deepEqual(errors, {});
  assert.equal(data.email, "sam.k@gmail.com");
  assert.equal(data.consent, true);
  assert.ok(data.name.length >= 2, "the backend's queue needs a name");
});

test("a blank name falls back to the address, a typed one is kept", () => {
  assert.equal(validateSignup({ email: "sam.k.2004@gmail.com" }).data.name, "sam k 2004");
  assert.equal(validateSignup({ email: "a@b.co", name: "" }).data.name, "beta tester");
  assert.equal(validateSignup({ email: "a@b.co", name: "  Priya  " }).data.name, "Priya");
  assert.equal(nameFromEmail("x@y.com"), "beta tester");
});

test("junk addresses and one-letter names are turned back", () => {
  assert.ok(validateSignup({ email: "" }).errors.email);
  assert.ok(validateSignup({ email: "not an email" }).errors.email);
  assert.ok(validateSignup({ email: "a@b" }).errors.email);
  assert.ok(validateSignup({ email: "a@b.co", name: "x" }).errors.name);
});

// Step two is optional and only ever sends what was picked.

test("details keep only known answers and respect the caps", () => {
  const { data, errors } = validateDetails({
    email: "sam@gmail.com",
    device: "  pixel   8a ",
    androidVersion: "Android 15",
    hours: "made up",
    genres: [...GENRES, "polka"],
    listensOn: ["spotify", "napster"],
  });
  assert.deepEqual(errors, {});
  assert.equal(data.device, "pixel 8a");
  assert.equal(data.androidVersion, "android 15");
  assert.equal(data.hours, "", "an answer not on the list is dropped");
  assert.equal(data.genres.length, LIMITS.genres);
  assert.ok(!data.genres.includes("polka"));
  assert.deepEqual(data.listensOn, ["spotify"]);
});

test("an empty details step is refused, so nothing blank is sent", () => {
  const { errors } = validateDetails({ email: "sam@gmail.com", genres: [] });
  assert.ok(errors.details);
  assert.equal(hasDetails({ device: "", androidVersion: "", listensOn: [], genres: [], hours: "", lastSkipped: "", notes: "" }), false);
  assert.equal(hasDetails({ device: "", androidVersion: "", listensOn: [], genres: ["soul"], hours: "", lastSkipped: "", notes: "" }), true);
});

test("details must belong to a real address", () => {
  assert.ok(validateDetails({ email: "nope", device: "pixel" }).errors.email);
});

test("chips toggle on and off and stop at the cap", () => {
  assert.deepEqual(toggleChip([], "soul", 2), ["soul"]);
  assert.deepEqual(toggleChip(["soul"], "soul", 2), []);
  assert.deepEqual(toggleChip(["soul", "house"], "k-pop", 2), ["soul", "house"]);
});
