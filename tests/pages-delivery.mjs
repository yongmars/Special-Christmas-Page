import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { servePages } from "./serve-pages.mjs";
import { differentTown, verifiedTown } from "../lib/delivery-town.ts";
import { move, departure } from "../lib/delivery-run.ts";

const { base, server } = await servePages();
const key = "noct-lux:christmas-2026:v1:season";
const output = "node_modules/.cache/delivery-qa";
const errors = [];
function alternateDelivery(town) {
  const hinted = town.solution.find(node => town.houses.includes(node));
  function search(visit, path) {
    if (visit.result === "won") return path;
    if (visit.result !== "playing") return null;
    for (const { a, b } of town.roads) {
      const target = a === visit.node ? b : b === visit.node ? a : -1;
      if (visit.delivered.length === 0 && target === hinted) continue;
      const step = move(town, visit, target);
      if (step.reason) continue;
      const solution = search(step.visit, [...path, target]);
      if (solution) return solution;
    }
    return null;
  }
  return search(departure(town), [town.start]);
}
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
  for (const mobile of [true, false]) {
    const page = await browser.newPage({ hasTouch: mobile, isMobile: mobile, viewport: mobile ?
      { width: 320, height: 680 } : { width: 1200, height: 900 }, reducedMotion: mobile ? "reduce" : "no-preference" });
    page.setDefaultTimeout(6500);
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.status() >= 400) errors.push(r.url()); });
    const game = base + "/games/delivery/";
    const button = name => page.getByRole("button", { name });
    const save = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)).deliveryV1, key);
    const record = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const node = n => page.locator('[data-node="' + n + '"]');
    async function go(n) {
      await page.locator('.dl-board[aria-busy="false"]').waitFor();
      if (mobile) await node(n).tap(); else await node(n).click();
    }
    await page.clock.setFixedTime(new Date("2026-12-20T23:59:59+09:00"));
    await page.goto(base + "/calendar/21/");
    await page.getByText(/0時（日本時間）に開きます/).waitFor();
    await page.goto(game + "?date=2026-12-25");
    await page.getByText(/0時（日本時間）に公開します/).waitFor();
    await page.clock.setFixedTime(new Date("2026-12-21T00:00:00+09:00"));
    await page.goto(base + "/calendar/21/");
    await page.getByRole("link", { name: "ゲームの入口へ" }).click();
    assert.ok(await button(/むずかしい/).isDisabled());
    await page.locator(".dl-game").screenshot({ path: output + "/menu-" + Number(mobile) + ".png" });
    // Keep unrelated rewards present to catch overwrites and verify all overlays together.
    await page.evaluate(k => {
      const p = JSON.parse(localStorage.getItem(k)); p.clears = ["sorting","slide","memory","jigsaw"];
      localStorage.setItem(k, JSON.stringify(p));
    },key);
    await page.reload();
    for (const level of ["practice","normal","hard"]) {
      await button({ practice:/練習.*はじめて/, normal:/ふつう.*クリスマスの町へ/, hard:/むずかしい.*サンタ/ }[level]).click();
      const initial = await save();
      let town = verifiedTown(level, initial.seed);
      assert.equal(await page.locator(".dl-number").count(), level === "practice" ? 3 : 0);
      assert.equal(await button("一手戻す").count(), level === "hard" ? 0 : 1);
      if (level !== "practice") {
        await button("別の町で遊ぶ").click();
        const next = verifiedTown(level, (await save()).seed);
        assert.ok(differentTown(town,next)); town = next;
        await button(/配達番号を表示/).click();
        assert.equal(await page.locator(".dl-number").count(), town.houses.length);
      } else {
        assert.equal(await button("別の町で遊ぶ").count(),0);
        await page.locator(".dl-road.closed path").first().click();
        await page.getByText(/雪山で通行止めだよ/).waitFor();
        await go(7); await go(6);
        await page.getByText(/そこは一度通った道路/).waitFor();
        await go(8);
        await page.locator(".dl-status.stranded").waitFor();
        await button("一手戻す").click(); await button("一手戻す").click();
        assert.equal((await save()).moves.length, 0);
        await go(7); await go(4); await go(5);
        await page.locator(".dl-status.wrong").waitFor(); await button("一手戻す").click();
        assert.deepEqual((await save()).moves,[7,4]);
      }
      await button("最初から").click(); assert.equal((await save()).seed, town.seed);
      const route = level === "normal" ? alternateDelivery(town) : town.solution;
      assert.ok(route);
      const first = node(route[1]);
      if (!mobile) {
        await first.focus(); await first.press("Enter");
        // A second synchronous command while the sleigh is moving must be ignored.
        await node(route[2]).evaluate(el => el.click());
      } else await go(route[1]);
      assert.deepEqual((await save()).moves,[route[1]]);
      await page.reload(); await button(/続きから/).click();
      assert.equal(await page.locator('[aria-current="location"]').getAttribute("data-node"), String(route[1]));
      assert.equal((await save()).seed,town.seed);
      await page.locator(".dl-board img").evaluateAll(images => Promise.all(images.map(img => img.decode())));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator(".dl-play").screenshot({ path: output + "/" + level + "-" + Number(mobile) + ".png" });
      let visit = move(town, departure(town), route[1]).visit;
      for (const n of route.slice(2)) {
        await go(n); visit = move(town, visit, n).visit;
        assert.equal(await page.locator(".dl-cargo i").count(), town.houses.length - visit.delivered.length);
      }
      await page.locator(".dl-status.won").waitFor();
      assert.equal((await record()).clears.includes("delivery"), level !== "practice");
      await page.getByRole("link", {name:/ゲームを終了して/}).click();
      if (level === "practice") assert.equal(await page.locator(".window-lights").count(),0);
      else {
        await page.locator(".window-lights").waitFor();
        assert.equal(await page.locator(".window-lights rect").count(),10);
        assert.equal(await page.locator(".room-rewards .lights,.room-rewards .wreath,.room-rewards .new-present,.room-rewards .room-cake").count(),4);
        if (level === "normal") {
          await button(/みんなにプレゼントも届いたし/).click();
          await button(/これでクリスマスの準備は完璧だね/).click();
          await page.locator(".room-scene").screenshot({path: output + "/home-" + Number(mobile) + ".png"});
        }
        await page.reload(); await page.locator(".window-lights").waitFor();
        assert.equal(await page.locator(".reward-notice").count(),0);
      }
      await page.goto(game);
    }
    // Lose after earning the reward. Also force a missing house image and verify its accessible name and text fallback.
    await page.route("**/delivery/house-plush.webp", route => route.abort());
    await button(/ふつう.*クリスマスの町へ/).click();
    const town = verifiedTown("normal",(await save()).seed);
    const failingPath = (visit,path) => {
      if (visit.result !== "playing") return visit.result === "won" ? null : path;
      for (const road of town.roads) {
        const target = road.a === visit.node ? road.b : road.b === visit.node ? road.a : -1;
        const step = move(town,visit,target);
        if (!step.reason) { const found = failingPath(step.visit,[...path,target]); if (found) return found; }
      }
    };
    for (const n of failingPath(departure(town),[])) await go(n);
    await page.locator(".dl-status:not(.playing)").waitFor();
    assert.ok((await record()).clears.includes("delivery"));
    await node(town.houses[0]).locator(".dl-fallback").waitFor();
    await button("一手戻す").click(); await page.locator(".dl-status.playing").waitFor();
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log("Pages delivery passed on desktop and 320px touch: calendar gates, all six clears, retries, resume, art, cargo and persistent village windows.");
} finally {
  await browser?.close(); server.close();
}
