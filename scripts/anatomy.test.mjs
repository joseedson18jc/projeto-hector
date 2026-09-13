import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseAtlas, isSystemId, explanation, isPresetActive, PRESETS } from "../app/anatomy.ts";

const raw = JSON.parse(await readFile(new URL("../public/models/atlas.json", import.meta.url)));
const clone = () => JSON.parse(JSON.stringify(raw));

test("the shipped atlas is accepted", () => {
  const atlas = parseAtlas(clone());
  assert.equal(atlas.parts.length, raw.parts.length);
  assert.equal(atlas.concepts.length, raw.concepts.length);
});

test("a geometry span outside its chunk is rejected", () => {
  // The scene builds typed-array views over these offsets, so an overrun that
  // reaches assembly surfaces only as an opaque RangeError.
  const overrun = clone();
  overrun.parts[0].positions = raw.chunks[raw.parts[0].chunk].bytes - 4;
  assert.throws(() => parseAtlas(overrun), /runs past its geometry chunk/);

  const indices = clone();
  indices.parts[0].indexCount = 1e9;
  assert.throws(() => parseAtlas(indices), /runs past its geometry chunk/);
});

test("a misaligned geometry offset is rejected", () => {
  for (const [field, alignment] of [
    ["positions", 4],
    ["normals", 2],
    ["indices", 4],
  ]) {
    const bad = clone();
    bad.parts[0][field] += 1;
    assert.throws(
      () => parseAtlas(bad),
      new RegExp(`${field} offset that is not ${alignment}-byte aligned`),
      `${field} misalignment should be rejected`,
    );
  }
});

test("structural faults are rejected with an actionable message", () => {
  assert.throws(() => parseAtlas(null), /did not contain an object/);
  assert.throws(() => parseAtlas({}), /lists no parts/);

  const noSystem = clone();
  noSystem.parts[0].system = "gizzard";
  assert.throws(() => parseAtlas(noSystem), /unknown system/);

  const duplicate = clone();
  duplicate.parts.push(duplicate.parts[0]);
  assert.throws(() => parseAtlas(duplicate), /appears more than once/);

  const missingChunk = clone();
  missingChunk.parts[0].chunk = 999;
  assert.throws(() => parseAtlas(missingChunk), /missing geometry chunk/);

  const danglingConcept = clone();
  danglingConcept.concepts[0].elements = ["not-a-part"];
  assert.throws(() => parseAtlas(danglingConcept), /references missing part/);

  const noBounds = clone();
  noBounds.parts[0].bounds = [[0, 0, 0]];
  assert.throws(() => parseAtlas(noBounds), /invalid bounds/);
});

test("every part in the shipped atlas names a known system", () => {
  assert.ok(raw.parts.every((p) => isSystemId(p.system)));
  assert.equal(isSystemId("gizzard"), false);
  assert.equal(isSystemId(undefined), false);
});

test("explanation falls back to the system description", () => {
  assert.match(explanation("heart", "cardiac"), /muscular pump/);
  // An unknown structure still gets its system's context rather than nothing.
  assert.ok(explanation("some unnamed structure", "skeletal").length > 0);
  assert.equal(explanation("some unnamed structure", "nonsense"), "");
});

test("preset pressed state matches what the preset applies", () => {
  for (const preset of PRESETS) {
    if (!preset.systems) continue;
    assert.ok(isPresetActive(preset.systems, preset.systems));
    assert.ok(isPresetActive(preset.systems.toReversed(), preset.systems), "order must not matter");
    assert.equal(isPresetActive([...preset.systems, "nervous"], preset.systems), false);
    assert.equal(isPresetActive(preset.systems.slice(1), preset.systems), false);
  }
});
