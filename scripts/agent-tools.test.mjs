import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { atlasTools } from "../app/agent-tools.ts";

const atlas = JSON.parse(await readFile(new URL("../public/models/atlas.json", import.meta.url)));

function tools() {
  let selected = null;
  const [find, inspect] = atlasTools(atlas, (c) => {
    selected = c;
  });
  return { find, inspect, selected: () => selected };
}

test("find_anatomy returns the asked-for structure first", () => {
  const { find } = tools();
  // Regression: this filtered in raw manifest order with no ranking, so
  // "heart" answered "region of wall of heart" and "aorta" omitted the aorta.
  for (const query of ["heart", "aorta", "femur", "tibia"]) {
    assert.equal(find.execute({ query })[0].name, query);
  }
});

test("find_anatomy agrees with the visible search panel", async () => {
  const { rankConcepts, AGENT_SEARCH_LIMIT } = await import("../app/search.ts");
  const { find } = tools();
  for (const query of ["heart", "lung", "nerve", "aorta"]) {
    assert.deepEqual(
      find.execute({ query }).map((r) => r.id),
      rankConcepts(atlas.concepts, query, AGENT_SEARCH_LIMIT).map((c) => c.id),
    );
  }
});

test("find_anatomy reports the piece count for each result", () => {
  const { find } = tools();
  const [first] = find.execute({ query: "heart" });
  const concept = atlas.concepts.find((c) => c.id === first.id);
  assert.equal(first.pieces, concept.elements.length);
});

test("find_anatomy honours an explicit limit and clamps it", () => {
  const { find } = tools();
  assert.equal(find.execute({ query: "a", limit: 3 }).length, 3);
  assert.ok(find.execute({ query: "a", limit: 500 }).length <= 200);
  assert.throws(() => find.execute({ query: "a", limit: 2.5 }), /whole number/);
});

test("find_anatomy rejects malformed input", () => {
  const { find } = tools();
  assert.throws(() => find.execute({ query: " " }), /nonempty/);
  assert.throws(() => find.execute({}), /nonempty/);
  assert.throws(() => find.execute(null), /Expected an object/);
  assert.throws(() => find.execute([]), /Expected an object/);
  assert.throws(() => find.execute({ query: 12 }), /nonempty/);
});

test("inspect_anatomical_structure selects the named concept", () => {
  const { find, inspect, selected } = tools();
  const [first] = find.execute({ query: "femur" });
  const result = inspect.execute({ id: first.id });
  assert.equal(selected().id, first.id);
  assert.equal(result.name, selected().name);
  assert.equal(result.selectedPieces, selected().elements.length);
});

test("a failed inspection leaves the selection untouched", () => {
  const { find, inspect, selected } = tools();
  inspect.execute({ id: find.execute({ query: "femur" })[0].id });
  const before = selected();
  assert.throws(() => inspect.execute({ id: "nonexistent-structure" }), /not present/);
  assert.throws(() => inspect.execute({}), /identifier is required/);
  assert.equal(selected(), before);
});

test("both tools declare a schema and a read-only hint", () => {
  const { find, inspect } = tools();
  for (const tool of [find, inspect]) {
    assert.ok(tool.name && tool.description);
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
  }
  assert.equal(find.annotations.readOnlyHint, true, "search must not be marked as mutating");
  assert.equal(inspect.annotations.readOnlyHint, false, "inspection changes the visible selection");
});
