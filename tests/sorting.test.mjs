import test from "node:test";
import assert from "node:assert/strict";
import { makeSortingRound, bins } from "../lib/sorting.ts";

test("各回9種類、各箱5個、15問。隣り合う品物は異なる", () => {
  const orders = new Set();
  for (let n = 0; n < 200; n++) {
    const round = makeSortingRound();
    assert.equal(round.length, 15);
    assert.equal(new Set(round.map(item => item.id)).size, 9);
    for (const bin of bins) {
      assert.equal(round.filter(item => item.bin === bin.id).length, 5);
    }
    assert.ok(round.every((item, index) => item.id !== round[index - 1]?.id));
    orders.add(round.map(item => item.id).join(","));
  }
  assert.ok(orders.size > 1);
});
