import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("growth intel generator is available without paid keyword APIs", () => {
  const pkg = JSON.parse(read("package.json"));
  const script = read("scripts/growth-intel.ts");

  assert.equal(pkg.scripts["growth:intel"], "tsx scripts/growth-intel.ts");
  assert.match(script, /No Ahrefs subscription or paid keyword API required/);
  assert.match(script, /gsc-keyword-watch-template\.csv/);
  assert.match(script, /baseball card value checker/);
  assert.match(script, /pokemon card grading calculator/);
});
