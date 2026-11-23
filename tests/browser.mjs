import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, devices } from "playwright";
import { neighbors } from "../lib/slide.ts";
import { playSorting } from "./play-sorting.mjs";
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
  const preview = page.getByRole("dialog");
  let previews = 0;
  async function checkPreview(name) {
    await preview.waitFor();
    assert.equal(await preview.getAttribute("aria-label"), name + "のペアがそろったよ！");
    const art = preview.getByRole("img", { name, exact: true });
    await art.evaluate((img) => img.decode());
    assert.ok((await art.boundingBox()).width > (await cards.first().boundingBox()).width);
    assert.ok(await cards.evaluateAll((buttons) => buttons.every((b) => b.disabled)));
    assert.doesNotMatch(await page.locator(".game-stat").innerText(), /すべて/);
    previews++;
    if (previews === 1) {
      await preview.waitFor({ state: "hidden", timeout: 3500 });
    } else if (previews === 2) {
      await page.keyboard.press("Escape");
    } else if (previews % 2 === 0) {
      await art.click();
    } else {
      await preview.getByRole("button").click();
    }
    await page.locator(".memory-preview").waitFor({ state: "detached" });
  }
  for (let i = 0; i < 16; i += 2) {
    const names = [];
    for (const j of [i, i + 1]) {
      await cards.nth(j).click();
      const name = await cards.nth(j).getAttribute("aria-label");
      names.push(name);
      pairs.set(name, [...(pairs.get(name) || []), j]);
    }
    if (names[0] === names[1]) await checkPreview(names[0]);
    else await page.waitForFunction((index) =>
      !document.querySelectorAll(".memory-board button")[index].disabled, i);
  }
  assert.equal(pairs.size, 8);
  for (const [name, [a, b]] of pairs) {
    if (!(await cards.nth(a).isDisabled())) {
      await cards.nth(a).click();
      await cards.nth(b).click();
      await checkPreview(name);
    }
  }
  assert.match(await page.locator(".game-stat").innerText(), /すべて/);
  assert.equal(previews, 8);
}
async function slide(page, n) {
  await page.getByRole("combobox").last().selectOption(String(n));
  const board = page.locator(".slide-board");
  await page.waitForFunction(
    (n) => document.querySelectorAll(".slide-board button").length === n * n,
    n,
  );
  const readTiles = () => board.getByRole("button").evaluateAll(els =>
    els.map(b => b.classList.contains("blank") ? els.length - 1 : Number(b.getAttribute("aria-label").split(" ")[1]) - 1));
  const seq = await readTiles();
  await board.locator("button:enabled").first().click();
  await page.getByRole("button", {name:"リセット",exact:true}).click();
  assert.deepEqual(await readTiles(), seq);
  await page.getByRole("button", {name:"完成図を見る"}).click();
  await page.locator(".guide-image").waitFor();
  await page.locator(".guide-image").waitFor({state:"hidden",timeout:6000});
  assert.deepEqual(await readTiles(), seq);
  for (const v of solution(seq, n))
    await board
      .getByRole("button", { name: "ピース " + v, exact: true })
      .click();
  assert.match(await page.locator(".game-stat").innerText(), /完成/);
  assert.match(await page.locator(".game-stat").innerText(), /ベスト記録 \d+ 手/);
  await page.waitForFunction(() => document.querySelector(".slide-result img")?.naturalWidth === 1254);
  await page.getByRole("button", {name:"もう一度あそぶ"}).click();
  await board.waitFor();
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
  await page.getByRole("heading", {name:"かんせい！できたね！"}).waitFor();
  await page.locator(".jg-finished-art").waitFor();
  assert.equal(await page.locator(".jg-surface").count(), 0);
  await page.getByRole("button", {name:"もう一度あそぶ"}).click();
  await page.locator(".jg-piece.loose").first().waitFor();
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
    await p.getByRole("heading", { name: "クリスマスパーティー" }).waitFor();
    await p.getByText("準備中です。", { exact: true }).waitFor();
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.waitForFunction(() =>
      JSON.parse(
        localStorage.getItem("noct-lux:christmas-2026:v1:preview") || "{}",
      ).opened?.includes(25),
    );
    await p.getByRole("link", { name: "カレンダーにもどる" }).click();
    await p.locator(".door.opened").first().waitFor();
    for (const day of [2,5,8,11,14,16,19,22,7,12,18,23]) {
      await p.goto(url("/calendar/" + day));
      const art = p.locator(".book-zoom img");
      await art.evaluate(el => el.decode());
      await p.locator(".book-zoom").click();
      const full = p.getByRole("dialog");
      await full.waitFor();
      assert.equal(await full.locator("img").getAttribute("src"), await art.getAttribute("src"));
      await full.getByRole("button", { name: "閉じる" }).click();
      await full.waitFor({ state: "hidden" });
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    for (const [day, correct] of [[4,0],[9,1],[15,2],[17,1]]) {
      const quiz = JSON.parse(await readFile("content/days/" + String(day).padStart(2,"0") + ".json","utf8"));
      await p.goto(url("/calendar/" + day));
      await p.getByText(quiz.question,{exact:true}).waitFor();
      const buttons = p.locator(".choices button");
      assert.equal(await buttons.count(),3);
      for (const index of [(correct + 1) % 3,correct]) {
        assert.ok((await buttons.nth(index).boundingBox()).height >= 44);
        await buttons.nth(index).click();
        const result = p.locator(".answer");
        const message = index === correct ? quiz.correct : quiz.incorrect;
        await result.locator(".speech." + quiz.who).getByText(message,{exact:true}).waitFor();
        await result.getByText(quiz.explanation,{exact:true}).waitFor();
        assert.equal(await buttons.nth(correct).getAttribute("class"),"correct");
        assert.equal(await p.locator(".choices button:disabled").count(),3);
        await p.reload();
        await result.getByText(message,{exact:true}).waitFor();
        if (index !== correct) {
          await result.getByRole("button",{name:"もう一度"}).click();
          await p.reload();
          assert.equal(await p.locator(".choices button:enabled").count(),3);
        }
      }
    }
    await p.goto(url("/calendar/1"));
    assert.equal(await p.locator("figure").count(), 2);
    for (const [i,file] of ["december.png","winter-night.png"].entries()) {
      const download = p.waitForEvent("download");
      await p.getByText("画像を保存").nth(i).click();
      assert.equal((await download).suggestedFilename(), file);
    }
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
    const reward = p.locator(".reward-notice");
    const checkReward = async (id, who, line, decoration, animation) => {
      await p.locator(decoration).waitFor();
      await reward.filter({hasText:line}).waitFor();
      assert.equal(await reward.getAttribute("class"), "reward-notice " + who);
      assert.equal(await p.locator(".room-rewards").getAttribute("data-arriving"), animation);
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const bounds = await reward.boundingBox();
      const bar = await p.locator(".present-bar").boundingBox();
      assert.ok(bounds.y + bounds.height <= bar.y, id);
    };
    await checkReward("memory", "noct", "リースが飾られたね。クリスマスらしくなってきたな", ".wreath", "wreath");
    await reward.getByRole("button").click();
    await checkReward("slide", "noct", "プレゼントも並んだね。喜んでくれるかな？", ".new-present", "presents");
    await p.reload();
    await checkReward("jigsaw", "lux", "わあっ！ ツリーがキラキラ！ きれいだね！", ".lights", "lights");
    await p.reload();
    assert.equal(await reward.count(), 0);
    for (const selector of [".lights", ".wreath", ".new-present"])
      await p.locator(selector).waitFor();
    await p.goto(url("/calendar/13", "2026-12-13"));
    await p.getByRole("link", { name: "ゲームの入口へ" }).click();
    await p.getByRole("button", { name: "試遊する" }).click();
    await playSorting(p, name !== "desktop");
    await p.getByRole("button", { name: "もう一度あそぶ" }).click();
    assert.equal(await p.locator("progress").getAttribute("value"), "0");
    await p.getByRole("link", { name: "お部屋に戻る", exact: true }).click();
    await checkReward("sorting", "lux", "ケーキだ！ ねえ、ちょっと味見しちゃダメ？", ".room-cake", "cake");
    await reward.getByRole("button").click();
    await p.locator("summary").click();
    await p.getByRole("checkbox",{name:"プレゼント配達"}).check();
    await checkReward("delivery", "noct", "みんなにプレゼントも届いたし……", ".window-lights", "village-lights");
    await reward.getByRole("button").click();
    await checkReward("delivery", "lux", "これでクリスマスの準備は完璧だね！", ".window-lights", "village-lights");
    await reward.getByRole("button").click();
    await p.reload();
    await p.locator(".room-cake").waitFor();
    await p.locator(".window-lights").waitFor();
    assert.equal(await reward.count(), 0);
    await p.locator("summary").click();
    await p.getByRole("button", { name: "プレビュー記録をリセット" }).click();
    assert.equal(
      await p.locator(".wreath,.lights,.new-present,.room-cake,.window-lights,.door.opened").count(),
      0,
    );
    await ctx.close();
  }
  const legacy = await browser.newPage();
  await legacy.goto(url());
  await legacy.evaluate(() => localStorage.setItem("noct-lux:christmas-2026:v1:preview",JSON.stringify({opened:[1,7],clears:["memory"],slideBest:{"3":5}})));
  await legacy.reload();
  await legacy.locator(".wreath").waitFor();
  assert.equal(await legacy.locator(".lights").count(),0);
  assert.equal(await legacy.locator(".reward-notice").count(),0);
  assert.equal(await legacy.locator(".door.opened").count(),2);
  await legacy.goto(url("/games/slide"));
  await legacy.getByRole("button",{name:"試遊する"}).click();
  assert.match(await legacy.locator(".game-stat").innerText(), /ベスト記録 5 手/);
  await legacy.close();
  for (const [date, count] of [
    ["2026-11-29", 0],
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
    assert.ok(await p.locator(".content-card img").evaluateAll(async imgs => {await Promise.all(imgs.map(img => img.decode()));return imgs.every(img => img.naturalWidth>0)}));
  }
  await p.goto(url("/games/jigsaw","2026-12-05"));
  assert.equal(await p.getByRole("button",{name:"試遊する"}).count(),0);
  await p.locator("summary").click();await p.locator('input[type="date"]').fill("2026-12-06");
  await p.getByRole("button",{name:"日付を適用"}).click();await p.getByRole("button",{name:"試遊する"}).waitFor();
  await p.close();
  console.log("Dates, downloads, progress, touch controls: OK");
} finally {
  await browser.close();
}
