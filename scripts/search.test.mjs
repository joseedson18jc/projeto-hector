import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { rankConcepts, suggestedConcepts, SUGGESTED } from "../app/search.ts";

const atlas = JSON.parse(await readFile(new URL("../public/models/atlas.json", import.meta.url)));
const names = (query, limit) => rankConcepts(atlas.concepts, query, limit).map((c) => c.name);

test("an exact name match ranks first", () => {
  // Regression: ordering by name length alone, and the agent tool's unordered
  // filter, both answered "heart" with "region of wall of heart" and never
  // returned "aorta" for "aorta" within the first results at all.
  for (const query of ["heart", "aorta", "femur", "tibia", "liver", "stomach", "brain"]) {
    assert.equal(names(query)[0], query, `"${query}" should return itself first`);
  }
});

test("word-boundary matches outrank mid-word matches", () => {
  const ranked = names("tibia");
  const leftTibia = ranked.indexOf("left tibia");
  const iliotibial = ranked.findIndex((n) => n.includes("iliotibial"));
  assert.ok(leftTibia >= 0, "expected left tibia in the results");
  assert.ok(iliotibial >= 0, "expected an iliotibial structure in the results");
  assert.ok(leftTibia < iliotibial, "left tibia should rank above iliotibial tract");
});

test("a name match outranks an incidental identifier match", () => {
  // FMA7088 is the heart. Searching its digits must not promote unrelated
  // structures whose identifiers happen to contain them.
  const ranked = rankConcepts(atlas.concepts, "7088", 10);
  assert.equal(ranked[0].id, "FMA7088");
});

test("an exact identifier match resolves to that concept", () => {
  const sample = atlas.concepts[1234];
  assert.equal(rankConcepts(atlas.concepts, sample.id, 5)[0].id, sample.id);
  assert.equal(rankConcepts(atlas.concepts, sample.id.toLowerCase(), 5)[0].id, sample.id);
});

test("ranking is case- and whitespace-insensitive", () => {
  assert.deepEqual(names("  HEART  "), names("heart"));
});

test("the limit is honoured and an empty query matches nothing", () => {
  assert.equal(rankConcepts(atlas.concepts, "a", 7).length, 7);
  assert.equal(rankConcepts(atlas.concepts, "", 10).length, 0);
  assert.equal(rankConcepts(atlas.concepts, "   ", 10).length, 0);
  assert.equal(rankConcepts([], "heart", 10).length, 0);
});

test("a query matching nothing returns nothing", () => {
  assert.deepEqual(names("zzzzznotastructure"), []);
});

test("ranking is deterministic and total", () => {
  // Equal-tier, equal-length names must not depend on input order.
  const shuffled = atlas.concepts.toReversed();
  assert.deepEqual(
    names("vein", 40),
    rankConcepts(shuffled, "vein", 40).map((c) => c.name),
  );
});

test("every suggested starting point exists in the atlas", () => {
  const suggested = suggestedConcepts(atlas.concepts);
  assert.equal(suggested.length, SUGGESTED.length);
  assert.deepEqual(
    suggested.map((c) => c.name.toLowerCase()),
    [...SUGGESTED],
  );
});

test("suggestions skip names the atlas does not contain", () => {
  assert.deepEqual(suggestedConcepts([]), []);
});
