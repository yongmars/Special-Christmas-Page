import assert from "node:assert/strict";
import { chromium, devices } from "playwright";
import { neighbors } from "../lib/slide.ts";
import path from "node:path";
import os from "node:os";
const base = process.env.SITE_URL || "http://127.0.0.1:3016",
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
const url = (route = "", date = "2026-12-25") =>
  base + "/dev/preview" + route + "?date=" + date;
const errors = [];
function solution(seq, n) {
  const end = seq.length - 1,
    goalDist = (value, i) =>
      Math.abs((i % n) - (value % n)) +
      Math.abs(Math.floor(i / n) - Math.floor(value / n));
  function search(blank, prev, depth, limit, moves) {
    const distance = seq.reduce(
      (acc, v, i) => acc + (v === end ? 0 : goalDist(v, i)),
      0,
    );
    if (!distance) return moves.slice();
    if (distance + depth > limit) return null;
    for (const j of neighbors(blank, n)) {
      if (j === prev) continue;
      const v = seq[j];
      [seq[blank], seq[j]] = [v, end];
      moves.push(v + 1);
      const found = search(j, blank, depth + 1, limit, moves);
      moves.pop();
      [seq[j], seq[blank]] = [v, end];
      if (found) return found;
    }
    return null;
  }
  for (let limit = 0; limit <= 36; limit++) {
    const found = search(seq.indexOf(end), -1, 0, limit, []);
    if (found) return found;
  }
  throw Error("solution not found");
}
async function memory(page) {
  const board = page.locator(".memory-board"),
    cards = board.getByRole("button");
  await cards.first().waitFor();
  const pairs = new Map();
  for (let i = 0; i < 16; i += 2) {
    for (const j of [i, i + 1]) {
      await cards.nth(j).click();
      const name = await cards.nth(j).getAttribute("aria-label");
      pairs.set(name, [...(pairs.get(name) || []), j]);
    }
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".memory-board .flipped:not(:disabled)")
          .length === 0,
    );
    if (i < 14) await cards.nth(i + 2).waitFor({ state: "visible" });
    await page.waitForTimeout(800);
  }
  assert.equal(pairs.size, 8);
  for (const [a, b] of pairs.values()) {
    if (!(await cards.nth(a).isDisabled())) {
      await cards.nth(a).click();
      await cards.nth(b).click();
    }
  }
  assert.match(await page.locator(".game-stat").innerText(), /すべて/);
}
async function slide(page, n) {
  await page.getByRole("combobox").last().selectOption(String(n));
  const board = page.locator(".slide-board");
  await page.waitForFunction(
    (n) => document.querySelectorAll(".slide-board button").length === n * n,
    n,
  );
  const seq = await board
    .getByRole("button")
    .evaluateAll((els) =>
      els.map((b) => Number(b.getAttribute("aria-label").split(" ")[1]) - 1),
    );
  for (const v of solution(seq, n))
    await board
      .getByRole("button", { name: "ピース " + v, exact: true })
      .click();
  assert.match(await page.locator(".game-stat").innerText(), /完成/);
}
async function jigsaw(page, touch) {
  const pieces = page.locator(".jg-piece");
  await pieces.first().waitFor();
  const surface = page.locator(".jg-surface");
  await surface.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const board = await page.locator(".jg-board").boundingBox(),
    tray = await page.locator(".jg-tray").boundingBox();
  assert.ok(
    touch ? tray.y > board.y + board.height : tray.x > board.x + board.width,
  );
  const cdp = await page.context().newCDPSession(page);
  const finger = (type, p) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: p ? [{ ...p, id: 1, radiusX: 2, radiusY: 2 }] : [],
    });
  for (let i = 0; i < 9; i++) {
    const piece = page.locator('[data-piece="' + i + '"]');
    const center = () =>
      piece.evaluate((g) => {
        const p = new DOMPoint(50, 50).matrixTransform(g.getScreenCTM());
        return { x: p.x, y: p.y };
      });
    for (
      let j = 0;
      j < 4 && Number(await piece.getAttribute("data-angle")) !== 0;
      j++
    ) {
      const p = await center();
      if (touch) {
        await finger("touchStart", p);
        await finger("touchEnd");
      } else await page.mouse.click(p.x, p.y);
    }
    const p = await center(),
      dst = {
        x: board.x + (((i % 3) + 0.5) * board.width) / 3,
        y: board.y + ((Math.floor(i / 3) + 0.5) * board.height) / 3,
      };
    if (touch) {
      await finger("touchStart", p);
      for (let j = 1; j <= 6; j++)
        await finger("touchMove", {
          x: p.x + ((dst.x - p.x) * j) / 6,
          y: p.y + ((dst.y - p.y) * j) / 6,
        });
      await finger("touchEnd");
    } else {
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.move(dst.x, dst.y, { steps: 5 });
      await page.mouse.up();
    }
    if (i < 8)
      assert.equal(
        await piece.getAttribute("data-placed"),
        "true",
        "piece " + i,
      );
  }
  await page.getByRole("status").filter({ hasText: "かんせい！" }).waitFor();
}
try {
  for (const [name, opts] of [
    ["desktop", { viewport: { width: 1440, height: 940 } }],
    ["android", devices["Pixel 7"]],
    ["iphone", devices["iPhone 13"]],
  ]) {
    const ctx = await browser.newContext(opts),
      p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url());
    await p.waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".cat img")).filter(
          (img) => img.complete && img.naturalWidth > 0,
        ).length === 2,
    );
    await p.screenshot({
      path: path.join(os.tmpdir(), "noct-christmas-" + name + ".png"),
    });
    assert.equal(await p.locator(".door").count(), 25);
    const dim = await p.locator(".door").first().boundingBox();
    assert.ok(dim.width >= 44 && dim.height >= 44);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    console.log(name, "room and 25 doors");
    const headingFits = await p.locator(".hero h1").evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const frame = el.closest(".hero").getBoundingClientRect();
      return Array.from(range.getClientRects()).every(r => r.left >= frame.left && r.right <= frame.right);
    });
    assert.ok(headingFits, name + " title fits inside the frame");
    await p.getByRole("link", { name: "今日のプレゼントを開ける" }).click();
    await p.getByRole("heading", { name: "4人のクリスマス会" }).waitFor();
    await p.locator(".body-text").evaluate(el => {el.textContent = "雪の夜、ふたりは窓辺に並んで座りました。".repeat(80)});
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.waitForFunction(() =>
      JSON.parse(
        localStorage.getItem("noct-lux:christmas-2026:v1:preview") || "{}",
      ).opened?.includes(25),
    );
    await p.getByRole("link", { name: "カレンダーにもどる" }).click();
    await p.locator(".door.opened").first().waitFor();
    await p.goto(url("/calendar/2"));
    await p.getByRole("button", { name: /てぶくろ/ }).click();
    await p.getByRole("status").filter({ hasText: "不正解" }).waitFor();
    await p.getByRole("button", { name: /くつ下/ }).click();
    await p.getByRole("status").filter({ hasText: "正解！" }).waitFor();
    await p.goto(url("/calendar/1"));
    assert.equal(await p.locator("figure").count(), 2);
    const download = p.waitForEvent("download");
    await p.getByText("画像を保存").first().click();
    assert.equal((await download).suggestedFilename(), "wall-desktop.png");
    for (const [id, fn] of [
      ["memory", memory],
      ["slide", (page) => slide(page, 3)],
      ["jigsaw", (page) => jigsaw(page, name !== "desktop")],
    ]) {
      await p.goto(url("/games/" + id));
      await p.getByRole("button", { name: "試遊する" }).click();
      await fn(p);
      if (id === "slide" && name === "desktop") await slide(p, 4);
      console.log(name, id, "cleared");
    }
    await p.getByRole("link", { name: "お部屋にもどる", exact: true }).click();
    await p.locator(".room-scene").waitFor();
    await p.reload();
    for (const selector of [".lights", ".wreath", ".new-present"])
      await p.locator(selector).waitFor();
    await p.locator("summary").click();
    await p.getByRole("button", { name: "プレビュー記録をリセット" }).click();
    assert.equal(
      await p.locator(".wreath,.lights,.new-present,.door.opened").count(),
      0,
    );
    await ctx.close();
  }
  for (const [date, count] of [
    ["2026-11-30", 0],
    ["2026-12-01", 1],
    ["2026-12-06", 6],
    ["2026-12-13", 13],
    ["2026-12-20", 20],
    ["2026-12-26", 25],
    ["2027-12-01", 25],
  ]) {
    const p = await browser.newPage();
    await p.goto(url("/calendar", date));
    assert.equal(await p.locator("a.door").count(), count);
    await p.close();
  }
  assert.deepEqual(errors, []);
  const p = await browser.newPage();
  for(let day=1;day<=25;day++){
    await p.goto(url("/calendar/"+day));
    await p.locator(".content-card h1").waitFor();
    assert.ok(await p.locator(".content-card img").evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth>0)));
  }
  await p.goto(url("/games/jigsaw","2026-12-19"));
  assert.equal(await p.getByRole("button",{name:"試遊する"}).count(),0);
  await p.locator("summary").click();await p.locator('input[type="date"]').fill("2026-12-20");
  await p.getByRole("button",{name:"日付を適用"}).click();await p.getByRole("button",{name:"試遊する"}).waitFor();
  await p.close();
  console.log("Dates, downloads, progress, touch controls: OK");
} finally {
  await browser.close();
}
