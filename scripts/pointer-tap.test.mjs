import test from "node:test";
import assert from "node:assert/strict";
import { PointerTap } from "../app/pointer-tap.ts";

test("a stationary press is a tap", () => {
  const tap = new PointerTap();
  tap.down(1, 10, 10, 5);
  assert.equal(tap.up(1, 12, 11), true);
});

test("a drag beyond the threshold is not a tap", () => {
  const tap = new PointerTap();
  tap.down(1, 10, 10, 5);
  tap.move(1, 40, 10);
  assert.equal(tap.up(1, 10, 10), false, "returning to the origin must not revive the tap");
});

test("a second finger cancels the gesture for both pointers", () => {
  const tap = new PointerTap();
  tap.down(1, 10, 10, 12);
  tap.down(2, 20, 20, 12);
  assert.equal(tap.up(2, 20, 20), false);
  assert.equal(tap.up(1, 10, 10), false);
});

test("a cancelled pointer is not a tap", () => {
  const tap = new PointerTap();
  tap.down(1, 10, 10, 5);
  tap.cancel(1);
  assert.equal(tap.up(1, 10, 10), false);
});

test("the next gesture starts clean after a blocked one", () => {
  const tap = new PointerTap();
  tap.down(1, 10, 10, 5);
  tap.move(1, 80, 80);
  tap.up(1, 80, 80);
  tap.down(1, 10, 10, 5);
  assert.equal(tap.up(1, 10, 10), true);
});

test("a release without a press is not a tap", () => {
  const tap = new PointerTap();
  assert.equal(tap.up(7, 10, 10), false);
});

test("movement is judged against the per-pointer threshold", () => {
  const tap = new PointerTap();
  // Touch gets a looser threshold than a mouse; the same 10px slip differs.
  tap.down(1, 0, 0, 12);
  tap.move(1, 10, 0);
  assert.equal(tap.up(1, 10, 0), true);
  tap.down(2, 0, 0, 5);
  tap.move(2, 10, 0);
  assert.equal(tap.up(2, 10, 0), false);
});
