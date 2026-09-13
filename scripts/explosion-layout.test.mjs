import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createExplosionLayout } from "../app/explosion-layout.ts";

const atlas = JSON.parse(await readFile(new URL("../public/models/atlas.json", import.meta.url)));

/** Desktop wide, square, and phone-portrait viewport aspect ratios. */
const ASPECTS = [1.7, 1, 0.46];

function assertNonOverlapping(cells, label) {
  for (let i = 0; i < cells.length; i++) {
    const a = cells[i];
    for (let j = i + 1; j < cells.length; j++) {
      const b = cells[j];
      assert.ok(
        Math.abs(a.x - b.x) >= (a.width + b.width) / 2 - 1e-8 ||
          Math.abs(a.y - b.y) >= (a.height + b.height) / 2 - 1e-8,
        `${label}: exploded pieces overlap`,
      );
    }
  }
}

test("every visible piece gets its own cell inside the reported extent", () => {
  const groups = [
    ["all parts", atlas.parts],
    ...[...new Set(atlas.parts.map((p) => p.system))].map((system) => [
      system,
      atlas.parts.filter((p) => p.system === system),
    ]),
  ];
  for (const [label, group] of groups) {
    for (const aspect of ASPECTS) {
      const layout = createExplosionLayout(group, aspect);
      const cells = [...layout.cells.values()];
      assert.equal(cells.length, group.length, `${label} @ ${aspect}: missing cells`);
      for (const cell of cells) {
        assert.ok(
          Math.abs(cell.x) + cell.width / 2 <= layout.width / 2 + 1e-8,
          `${label} @ ${aspect}: cell escapes the layout width`,
        );
        assert.ok(
          Math.abs(cell.y) + cell.height / 2 <= layout.height / 2 + 1e-8,
          `${label} @ ${aspect}: cell escapes the layout height`,
        );
      }
      assertNonOverlapping(cells, `${label} @ ${aspect}`);
    }
  }
});

test("the layout is centred on the origin", () => {
  const layout = createExplosionLayout(atlas.parts.slice(0, 400), 1.6);
  const cells = [...layout.cells.values()];
  const left = Math.min(...cells.map((c) => c.x - c.width / 2));
  const right = Math.max(...cells.map((c) => c.x + c.width / 2));
  const bottom = Math.min(...cells.map((c) => c.y - c.height / 2));
  const top = Math.max(...cells.map((c) => c.y + c.height / 2));
  assert.ok(Math.abs(left + right) < 1e-6, "horizontally off-centre");
  assert.ok(Math.abs(bottom + top) < 1e-6, "vertically off-centre");
});

test("the layout is deterministic regardless of input order", () => {
  const sample = atlas.parts.slice(0, 250);
  const a = createExplosionLayout(sample, 1.2);
  const b = createExplosionLayout(sample.toReversed(), 1.2);
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  for (const [id, cell] of a.cells) assert.deepEqual(b.cells.get(id), cell);
});

test("degenerate inputs are handled", () => {
  assert.equal(createExplosionLayout([]).cells.size, 0);
  const single = createExplosionLayout([atlas.parts[0]], 1);
  assert.equal(single.cells.size, 1);
  // A lone piece sits at the centre of its own layout.
  const [only] = [...single.cells.values()];
  assert.ok(Math.abs(only.x) < 1e-8 && Math.abs(only.y) < 1e-8);
});

test("a piece with no extent still receives a usable cell", () => {
  const flat = {
    id: "flat",
    system: "skeletal",
    bounds: [
      [0, 0, 0],
      [0, 0, 0],
    ],
  };
  const layout = createExplosionLayout([flat], 1);
  const cell = layout.cells.get("flat");
  assert.ok(cell.width > 0 && cell.height > 0, "zero-extent piece collapsed to an empty cell");
});
