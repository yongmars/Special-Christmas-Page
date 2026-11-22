import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { tokyoDate, validDate, season, nextMidnight } from "../lib/season.ts";
import { neighbors, shuffle, solved } from "../lib/slide.ts";
test("日本時間の0時に切り替わり、開催前・25日・終了後・翌年を区別する", () => {
  for (const day of [1, 3, 10, 13, 17, 20, 25, 26]) {
    const expected = "2026-12-" + String(day).padStart(2, "0"),
      t = Date.parse(expected + "T00:00:00+09:00");
    assert.equal(tokyoDate(t), expected);
    assert.notEqual(tokyoDate(t - 1), expected);
    assert.equal(nextMidnight(t - 1), t);
  }
  assert.deepEqual(season("2026-11-30"), { today: 0, ended: false, days: 25 });
  assert.equal(season("2026-12-25").today, 25);
  for (const d of ["2026-12-26", "2027-12-01"])
    assert.deepEqual(season(d), { today: 0, ended: true, days: 0 });
  for (const d of ["no", "2026-02-30", "", null])
    assert.equal(validDate(d), false);
});
test("25日分の登録、画像、クイズ、ゲーム日付を検証", async () => {
  const read = async (p) => JSON.parse(await readFile(p, "utf8"));
  const games = await read("content/games.json");
  const days = new Set();
  for (let n = 1; n <= 25; n++) {
    const key = String(n).padStart(2, "0"),
      d = await read("content/days/" + key + ".json");
    assert.equal(d.day, n);
    days.add(d.kind);
    const g = games.find((g) => g.id === d.gameId);
    assert.equal(g?.releaseDate ?? d.releaseDate, "2026-12-" + key);
    const files = [d.image, ...(d.images || [])]
      .filter(Boolean)
      .map((a) => a.file);
    if (g?.image) files.push(g.image);
    if (g?.backFile) files.push(g.backFile);
    if (g?.id === "memory") {
      const fronts = g.faces.map((face) => face.file);
      assert.equal(fronts.length, 8);
      assert.equal(new Set(fronts).size, 8);
      assert.ok(fronts.every((file) => file && file !== g.backFile));
      files.push(...fronts);
    }
    for (const file of files)
      await access("assets/christmas/" + key + "/" + file);
    if (d.kind === "quiz") {
      assert.equal(d.choices.length, 3);
      assert.ok(d.choices[d.answer]);
      assert.ok(d.explanation);
    }
  }
  assert.deepEqual([...days].sort(), ["game","illustration","quiz","special","story","wallpaper"]);
});
test("スライドのシャッフルは合法な移動を使い、未完成・重複なし", () => {
  for (const n of [3, 4])
    for (let i = 0; i < 35; i++) {
      const a = shuffle(n);
      assert.equal(new Set(a).size, n * n);
      assert.ok(!solved(a));
      assert.deepEqual(neighbors(0, n), [n, 1]);
    }
});

test("確定日程のシリーズ・話数・ゲーム・クイズを照合する", async () => {
  const expected = [
    "wallpaper", "lux1", "memory", "stocking", "lux2", "special", "gallery1", "lux3", "nicholas",
    "slide", "lux4", "gallery2", "jigsaw", "noct1", "antlers", "noct2", "sorting",
    "gallery3", "noct3", "delivery", "holly", "noct4", "gallery4", "special", "special",
  ];
  for (const [index, key] of expected.entries()) {
    const day = JSON.parse(await readFile("content/days/" + String(index + 1).padStart(2, "0") + ".json", "utf8"));
    assert.equal(day.series ? day.series + day.episode : day.gameId ?? day.id ?? day.kind, key);
    if (day.series) {
      assert.equal(day.paragraphs.length, day.day === 23 ? 4 : 3);
      assert.doesNotMatch([day.title, day.image.alt, ...day.paragraphs].join(" "), /マフラー/);
    }
    if (day.kind === "quiz") {
      assert.ok(day.correct && day.incorrect && day.explanation);
      assert.equal(day.who, [4, 15].includes(day.day) ? "lux" : "noct");
    }
  }
});
