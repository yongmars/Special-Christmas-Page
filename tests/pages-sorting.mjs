import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { playSorting } from "./play-sorting.mjs";

// Serve the Pages build at its repository subpath and change only the test browser's clock.
const mount = "/" + (process.env.GITHUB_REPOSITORY?.split("/")[1] || "Special-Christmas-Page");
const root = path.resolve("dist-pages");
const types = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript",
  ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (!pathname.startsWith(mount + "/")) throw Error();
    let file = path.resolve(root, "." + pathname.slice(mount.length));
    if (file !== root && !file.startsWith(root + path.sep)) throw Error();
    if (!path.extname(file)) file = path.join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = "http://127.0.0.1:" + server.address().port + mount;
let browser;
try {
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
  const page = await browser.newPage({ hasTouch: true, isMobile: true,
    viewport: { width: 320, height: 680 }, reducedMotion: "reduce", timezoneId: "America/New_York" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", res => { if (res.status() >= 400) errors.push(res.url()); });
  await page.clock.setFixedTime(new Date("2026-12-12T23:59:59+09:00"));
  await page.goto(base + "/games/sorting/?date=2026-12-25");
  await page.getByText(/0時（日本時間）に公開します/).waitFor();
  assert.equal(await page.getByRole("button", { name: "あそぶ" }).count(), 0);
  await page.clock.setFixedTime(new Date("2026-12-13T00:00:00+09:00"));
  await page.goto(base + "/calendar/13/");
  await page.getByRole("link", { name: "ゲームの入口へ" }).click();
  const trials = [
    { wrong: [0, 6], deadlineTap: [3], timeout: [14], checkPause: true }, // 11, no reward
    { wrong: [2, 7, 12] }, // 12, first reward
    { wrong: [4, 7, 9, 11] }, // subsequent loss
    { checkPause: true }, // subsequent perfect round, covers all nine successful wraps
  ];
  for (const [run, trial] of trials.entries()) {
    if (run >= 2) {
      await page.setViewportSize({ width: 1200, height: 900 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    if (run) await page.goto(base + "/games/sorting/");
    const scenery = page.locator(".sort-scenery");
    await scenery.waitFor();
    assert.ok(await scenery.evaluate(async img => {
      await img.decode();
      return img.naturalWidth === 1774 && img.naturalHeight === 818 &&
        getComputedStyle(img).pointerEvents === "none";
    }));
    if (run === 2) {
      const stage = page.locator(".sort-stage");
      await stage.evaluate(el => {
        el.addEventListener("dragstart", () => { el.dataset.nativeDrag = "yes"; });
        el.scrollIntoView({ block: "center" });
      });
      const bounds = await stage.boundingBox();
      await page.mouse.move(bounds.x + 8, bounds.y + 8);
      await page.mouse.down();
      await page.mouse.move(bounds.x + 75, bounds.y + 20, { steps: 6 });
      await page.mouse.up();
      assert.equal(await stage.getAttribute("data-native-drag"), null);
    }
    await page.getByRole("button", { name: "あそぶ" }).tap();
    await page.locator(".sort-piece").waitFor();
    await page.locator(".sort-stage img").evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const track = await page.locator(".sort-track").boundingBox();
    const tread = await page.locator(".sort-belt").boundingBox();
    assert.ok(Math.abs(track.y + track.height - tread.y) < 1);
    assert.ok(await page.locator(".sort-boxes").evaluate(el =>
      el.getBoundingClientRect().bottom + scrollY <= innerHeight));
    if (run >= 2) {
      const belt = page.locator(".sort-belt");
      const position = await belt.evaluate(el => getComputedStyle(el).backgroundPositionX);
      await page.waitForFunction(previous =>
        getComputedStyle(document.querySelector(".sort-belt")).backgroundPositionX !== previous, position);
    }
    await page.screenshot({ path: path.join(os.tmpdir(), "christmas-sorting-" + (run >= 2 ? "desktop" : "mobile") + ".png"), fullPage: true });
    await playSorting(page, run < 2, trial);
    await page.getByRole("link", { name: "お部屋に戻る" }).tap();
    await page.locator(".room-scene").waitFor();
    if (run === 0) {
      assert.equal(await page.locator(".room-cake,.cake-table,.reward-notice").count(), 0);
      continue;
    }
    await page.locator(".room-cake").waitFor();
    assert.equal(await page.locator(".room-cake").count(), 1);
    const cakeImage = page.locator(".room-cake image.cake-table");
    await cakeImage.evaluate(async el => {
      const img = new Image();
      img.src = el.href.baseVal;
      await img.decode();
    });
    const table = await cakeImage.boundingBox();
    const room = await page.locator(".room-scene").boundingBox();
    const lux = await page.locator(".room-scene .cat.lux").boundingBox();
    assert.ok(table.x >= lux.x + lux.width && table.x + table.width <= room.x + room.width);
    assert.ok(table.y + table.height <= room.y + room.height);
    if (run === 1 || run === 2) {
      await page.locator(".room-scene").screenshot({ animations: "disabled",
        path: path.join(os.tmpdir(), "christmas-cake-table-" + (run === 1 ? "mobile" : "desktop") + ".png") });
    }
    if (run === 1) await page.locator(".reward-notice").getByText("ケーキだ！ ねえ、ちょっと味見しちゃダメ？").waitFor();
    else assert.equal(await page.locator(".reward-notice").count(), 0);
    await page.reload();
    await page.locator(".room-cake").waitFor();
    assert.equal(await page.locator(".cake-table").count(), 1);
    assert.equal(await page.locator(".reward-notice").count(), 0);
  }
  assert.deepEqual(errors, []);
  console.log("Pages: JST release, illustrated belt and nine items, three wraps, touch and desktop controls, pause, timeout, ranks and persistent cake passed.");
} finally {
  await browser?.close();
  server.close();
}
