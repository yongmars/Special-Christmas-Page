import test from "node:test";
import assert from "node:assert/strict";
import { makeSortingRound, bins, crossingTime, emptyScore, scoreItem, rank } from "../lib/sorting.ts";

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

test("横断は6秒・5秒・4秒。正解ごとの点数、ミス後のコンボとランク境界", () => {
  assert.deepEqual(Array.from({length: 15}, (_, i) => crossingTime(i)),
    [6000,6000,6000,6000,6000,5000,5000,5000,5000,5000,4000,4000,4000,4000,4000]);
  let s = emptyScore;
  for (const total of [100, 220, 360, 520, 700, 880]) {
    s = scoreItem(s, "correct");
    assert.equal(s.score, total);
  }
  for (const miss of ["wrong", "timeout"]) {
    const broken = scoreItem(s, miss);
    assert.deepEqual(broken, { correct: 6, misses: 1, score: 880, combo: 0, bestCombo: 6 });
    assert.equal(scoreItem(broken, "correct").score, 980);
  }
  assert.deepEqual([0, 11, 12, 13, 14, 15].map(rank), ["C","C","B","A","A","S"]);
  assert.equal(Array.from({length:15}).reduce(state => scoreItem(state, "correct"), emptyScore).score, 2500);
});
