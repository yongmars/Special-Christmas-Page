import assert from "node:assert/strict";
import { test } from "node:test";
import { newTown, differentTown, reserveSeeds, verifiedTown, solveTown, stages } from "../lib/delivery-town.ts";
import { departure, move, replay, restoreDelivery, readCheckpoint } from "../lib/delivery-run.ts";

test("練習は固定、最短7手。未使用道路から中央に戻れる", () => {
  const town = newTown("practice");
  assert.deepEqual(newTown("practice", town), town);
  assert.equal(town.solution.length, 8);
  assert.equal(town.solution.filter(n => n === 4).length, 2);
  assert.equal(replay(town, town.solution.slice(1)).result, "won");
  const first = move(town, departure(town), 7).visit;
  assert.deepEqual(first.delivered, [7]);
  const reverse = move(town, first, 6);
  assert.match(reverse.reason, /一度通った/);
  assert.equal(reverse.visit, first);
  assert.match(move(town, first, 3).reason, /隣/);
  assert.deepEqual(replay(town, []), departure(town));
  assert.match(move(town, { ...first, node: 8 }, 5).reason, /通行止め/);
  assert.equal(replay(town, [7,8]).result, "stranded");
  assert.equal(replay(town, [7,4,5]).result, "wrong");
  assert.equal(replay(town, [7,4,1,0,3,4]).result, "playing");
  // Use an unused road into the first house to distinguish a revisit from a road rejection.
  const atEight = { ...first, node: 8 };
  assert.equal(move(town, atEight, 7).visit.result, "revisited");
});

test("生成盤面・予備盤面は解け、家と行き止まりが前回から変わる", () => {
  for (const level of ["normal", "hard"]) {
    const reserves = reserveSeeds[level].map(seed => verifiedTown(level, seed));
    for (const [i,town] of reserves.entries()) {
      assert.ok(town);
      reserves.slice(0,i).forEach(other => assert.ok(differentTown(town, other)));
    }
    let previous = reserves[0];
    for (let i = 0; i < 35; i++) {
      const town = newTown(level, previous, i % 4 === 0 ? 0 : 160);
      assert.ok(differentTown(town, previous));
      const solved = solveTown(town);
      assert.ok(solved.connected && solved.exhausted);
      const visit = replay(town, town.solution.slice(1));
      assert.equal(visit.result, "won");
      assert.deepEqual(visit.delivered, town.solution.filter(n => town.houses.includes(n)));
      assert.deepEqual(visit.delivered.map(n => stages[level].order[town.houses.indexOf(n)]), stages[level].order);
      if (level === "normal") assert.equal(solved.firstHouses.size, 2);
      else assert.ok(solved.deadBranches >= 10);
      const save = { level, seed: town.seed, previous: { [level]: town.seed }, moves: town.solution.slice(1,4), hints: true };
      const restored = restoreDelivery(readCheckpoint(JSON.parse(JSON.stringify(save))));
      assert.deepEqual(restored.town, town);
      assert.deepEqual(restored.visit, replay(town, save.moves));
      previous = town;
    }
  }
  assert.equal(readCheckpoint({ level: "other" }), undefined);
  const saved = { level:"practice",seed:0,previous:{},hints:true,moves:[99] };
  assert.equal(restoreDelivery(saved), null);
});
