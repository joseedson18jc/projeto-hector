// Validate an anatomy manifest and its binary geometry chunks.
//
//   node scripts/validate-atlas.mjs [manifest.json]
//
// Every check is derived from the manifest itself, so the script validates any
// atlas the rebuild pipeline produces rather than only the revision that
// happened to ship. The shipped atlas additionally has a recorded fingerprint
// in scripts/atlas-expectations.json; when the manifest being checked has an
// entry there, its totals must still match, which is what catches a silent
// regression in the rebuild pipeline.
import fs from "node:fs";
import assert from "node:assert/strict";

const filename = process.argv[2] ?? "atlas.json";
const base = new URL("../public/models/", import.meta.url);
const manifestUrl = new URL(filename, base);
// The fingerprint is keyed by bare filename, so "./atlas.json" must not silently
// miss the recorded entry and skip the regression guard.
const manifestName = decodeURIComponent(manifestUrl.pathname.split("/").pop());
const atlas = JSON.parse(fs.readFileSync(manifestUrl));

const SYSTEM_IDS = new Set([
  "skeletal",
  "muscular",
  "arterial",
  "venous",
  "nervous",
  "digestive",
  "respiratory",
  "urinary",
  "reproductive",
  "lymphatic",
  "endocrine",
  "integumentary",
  "connective",
  "sensory",
  "cardiac",
]);

// Bounds are stored as float32 and compared against float32 positions, so allow
// one rounding step at the scale of the body (metres).
const BOUNDS_EPSILON = 1e-6;

assert.ok(Array.isArray(atlas.parts) && atlas.parts.length > 0, "manifest lists no parts");
assert.ok(Array.isArray(atlas.concepts) && atlas.concepts.length > 0, "manifest lists no concepts");
assert.ok(Array.isArray(atlas.chunks) && atlas.chunks.length > 0, "manifest lists no chunks");

const files = atlas.chunks.map((c, i) => {
  const b = fs.readFileSync(new URL(c.url.split("/").pop(), base));
  assert.equal(b.length, c.bytes, `chunk ${i} (${c.url}) byte length disagrees with the manifest`);
  if (c.gzip) {
    const gz = fs.readFileSync(new URL(c.gzip.split("/").pop(), base));
    assert.equal(gz.length, c.gzipBytes, `chunk ${i} compressed byte length disagrees`);
    assert.ok(gz[0] === 0x1f && gz[1] === 0x8b, `chunk ${i} .gz is not gzip-framed`);
  }
  return b;
});

const ids = new Set();
const conceptIds = new Set(atlas.concepts.map((c) => c.id));
const systemCounts = new Map();
let tris = 0;
let worstOvershoot = 0;

for (const p of atlas.parts) {
  assert.ok(typeof p.id === "string" && p.id, "a part has no id");
  assert.ok(!ids.has(p.id), `${p.id}: duplicated part id`);
  ids.add(p.id);
  assert.ok(
    p.name.trim() && p.name !== "-" && !p.name.includes("Bounds("),
    `${p.id}: unusable name ${JSON.stringify(p.name)}`,
  );
  // A part's concept id is shown in the detail panel as its atlas reference, so
  // it has to name a concept that exists.
  assert.ok(p.conceptId !== "-", `${p.id}: placeholder concept id`);
  assert.ok(conceptIds.has(p.conceptId), `${p.id}: concept id ${p.conceptId} is not in the atlas`);
  // An unknown system would render in the fallback colour and never appear
  // under any layer toggle.
  assert.ok(SYSTEM_IDS.has(p.system), `${p.id}: unknown system ${JSON.stringify(p.system)}`);
  systemCounts.set(p.system, (systemCounts.get(p.system) ?? 0) + 1);

  const b = files[p.chunk];
  assert.ok(b, `${p.id}: points at missing chunk ${p.chunk}`);
  assert.ok(p.vertexCount > 0, `${p.id}: no vertices`);
  assert.ok(p.indexCount >= 3 && p.indexCount % 3 === 0, `${p.id}: ${p.indexCount} indices`);

  // Typed-array views require aligned offsets and must stay inside the chunk.
  // Without this the viewer fails with an opaque RangeError during assembly.
  assert.equal(p.positions % 4, 0, `${p.id}: positions offset is not 4-byte aligned`);
  assert.equal(p.normals % 2, 0, `${p.id}: normals offset is not 2-byte aligned`);
  assert.equal(p.indices % 4, 0, `${p.id}: indices offset is not 4-byte aligned`);
  assert.ok(p.positions + p.vertexCount * 12 <= b.length, `${p.id}: positions run past the chunk`);
  assert.ok(p.normals + p.vertexCount * 6 <= b.length, `${p.id}: normals run past the chunk`);
  assert.ok(p.indices + p.indexCount * 4 <= b.length, `${p.id}: indices run past the chunk`);

  const pos = new Float32Array(b.buffer, b.byteOffset + p.positions, p.vertexCount * 3);
  const normals = new Int16Array(b.buffer, b.byteOffset + p.normals, p.vertexCount * 3);
  const indices = new Uint32Array(b.buffer, b.byteOffset + p.indices, p.indexCount);

  for (const i of indices) assert.ok(i < p.vertexCount, `${p.id}: index ${i} out of range`);

  const [lo, hi] = p.bounds;
  for (let v = 0; v < p.vertexCount; v++) {
    for (let a = 0; a < 3; a++) {
      const value = pos[v * 3 + a];
      assert.ok(Number.isFinite(value), `${p.id}: non-finite position`);
      // The scene culls raycasts by these bounds and packs the exploded layout
      // from them, so geometry outside them becomes unpickable.
      const overshoot = Math.max(lo[a] - value, value - hi[a]);
      if (overshoot > worstOvershoot) worstOvershoot = overshoot;
      assert.ok(overshoot <= BOUNDS_EPSILON, `${p.id}: vertex lies outside declared bounds`);
    }
    // Normals are dequantized on the GPU as n / 32767 and must be unit length.
    const x = normals[v * 3] / 32767,
      y = normals[v * 3 + 1] / 32767,
      z = normals[v * 3 + 2] / 32767;
    const length = Math.hypot(x, y, z);
    assert.ok(length > 0.5 && length < 1.5, `${p.id}: normal is not unit length (${length})`);
  }
  for (let a = 0; a < 3; a++) assert.ok(lo[a] <= hi[a], `${p.id}: inverted bounds on axis ${a}`);

  tris += p.indexCount / 3;
}

for (const c of atlas.concepts) {
  assert.ok(c.elements.length, `${c.id}: concept references no parts`);
  for (const id of c.elements) assert.ok(ids.has(id), `${c.id}: references missing part ${id}`);
}
assert.equal(tris, atlas.triangles, "manifest triangle total disagrees with the geometry");

// Every part must be reachable from at least one concept, otherwise search can
// never surface it.
const reachable = new Set(atlas.concepts.flatMap((c) => c.elements));
const orphans = [...ids].filter((id) => !reachable.has(id));
assert.equal(
  orphans.length,
  0,
  `parts unreachable from any concept: ${orphans.slice(0, 5).join(", ")}`,
);

const expectations = JSON.parse(
  fs.readFileSync(new URL("./atlas-expectations.json", import.meta.url), "utf8"),
);
const expected = expectations[manifestName];
if (expected) {
  assert.equal(atlas.parts.length, expected.parts, "part count changed");
  assert.equal(atlas.concepts.length, expected.concepts, "concept count changed");
  assert.equal(atlas.triangles, expected.triangles, "triangle count changed");
  for (const [system, count] of Object.entries(expected.systems ?? {})) {
    assert.equal(systemCounts.get(system), count, `${system} part count changed`);
  }
}

console.log(
  `${manifestName}: verified ${ids.size.toLocaleString()} individually indexed meshes across ` +
    `${systemCounts.size} systems, ${atlas.concepts.length.toLocaleString()} complete concept ` +
    `mappings, ${tris.toLocaleString()} triangles, every binary buffer, index range, buffer ` +
    `alignment, normal length, and bounds containment ` +
    `(worst overshoot ${worstOvershoot.toExponential(2)} m)` +
    `${expected ? ", against the recorded fingerprint" : ""}.`,
);
