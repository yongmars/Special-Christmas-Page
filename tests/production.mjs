// This harness controls a separate local process, never the application's clock in deployment.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import http from "node:http";
import next from "next";
import { chromium, devices } from "playwright";
if (process.argv[2] === "serve") {
  const app = next({ dev: false, hostname: "127.0.0.1" });
  await app.prepare();
  const handle = app.getRequestHandler(),
    real = Date.now.bind(Date);
  let offset = 0;
  Date.now = () => real() + offset;
  process.on("message", (s) => {
    offset = Date.parse(s) - real();
    process.send("clock");
  });
  const server = http.createServer((q, r) => handle(q, r));
  server.listen(0, "127.0.0.1", () => process.send(server.address().port));
} else {
  const child = spawn(
    process.execPath,
    [fileURLToPath(import.meta.url), "serve"],
    {
      stdio: ["ignore", "inherit", "inherit", "ipc"],
      env: { ...process.env, NODE_ENV: "production" },
    },
  );
  let browser;
  try {
    const [port] = await once(child, "message"),
      base = "http://127.0.0.1:" + port;
    const clock = async (s) => {
      const changed = once(child, "message");
      child.send(s + "+09:00");
      await changed;
    };
    const get = (path) => fetch(base + path),
      body = async (path) => (await get(path)).text();
    await clock("2026-11-30T12:00:00");
    assert.equal((await get("/dev/preview?date=2026-12-25")).status, 404);
    assert.equal(
      (await get("/dev/preview/games/jigsaw?date=2026-12-25")).status,
      404,
    );
    assert.equal(
      (await get("/art/1/december.png?preview=2027-01-01")).status,
      404,
    );
    assert.ok(
      !(await body("/calendar/2?date=2026-12-25")).includes(
        "クリスマスが近づいてきました",
      ),
    );
    browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || "msedge",
    });
    const p = await browser.newPage();
    // A real visible page must age into December without reloading by hand.
    await clock("2026-11-30T23:59:55");
    await p.goto(base);
    assert.equal(await p.locator("a.door").count(), 0);
    await p
      .getByRole("link", { name: "今日のプレゼントを開ける" })
      .waitFor({ timeout: 12000 });
    assert.equal(await p.locator("a.door").count(), 1);
    assert.equal((await get("/art/1/winter-night.png")).status, 200);
    for (const [day, id] of [
      [3, "memory"], [6, "jigsaw"], [10, "slide"], [13, "sorting"], [21, "delivery"],
    ]) {
      await clock("2026-12-" + String(day - 1).padStart(2, "0") + "T23:59:55");
      assert.match(await body("/games/" + id), /に公開します/);
      await clock("2026-12-" + String(day).padStart(2, "0") + "T00:00:00");
      assert.match(await body("/games/" + id), id === "delivery" ? /難易度を選ぶ/ : /あそぶ/);
      assert.match(await body("/calendar/" + day), /ゲームの入口へ/);
    }
    assert.match(await body("/calendar/20"), /クリスマス4コマ/);
    assert.doesNotMatch(await body("/calendar/20"), /ゲームの入口へ/);
    assert.equal((await get("/art/6/christmas-market.webp")).status,200);
    const videoPath = "/art/25/christmas-party.mp4";
    const picturePath = "/art/25/merry-christmas-2026.png";
    await clock("2026-12-24T23:59:55");
    assert.doesNotMatch(await body("/calendar/25"), /クリスマスパーティーへようこそ/);
    for (const asset of [videoPath, picturePath]) assert.equal((await get(asset)).status, 404);
    await clock("2026-12-25T00:00:00");
    const range = await fetch(base + videoPath, { headers: { Range: "bytes=0-1" } });
    assert.equal(range.status, 206);
    assert.match(range.headers.get("Content-Range"), /^bytes 0-1\//);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()),
      (await readFile("assets/christmas/25/christmas-party.mp4")).subarray(0, 2));

    await p.goto(base);
    await p.getByRole("link", { name: "今日のプレゼントを開ける" }).click();
    const video = p.locator(".finale video");
    await video.waitFor();
    await p.waitForFunction(() => document.querySelector(".finale video")?.readyState >= 1);
    assert.ok(await video.evaluate(el => el.paused && !el.muted && el.currentTime === 0 && el.duration > 9));
    await p.evaluate(() => {
      new MutationObserver(() => {
        if (document.querySelector(".finale-flash")) document.body.dataset.sawFlash = "yes";
      }).observe(document.querySelector(".finale-frame"), { childList: true });
    });
    await p.getByRole("button", { name: "動画を再生する" }).press("Enter");
    await p.waitForFunction(() => {
      const el = document.querySelector(".finale video");
      return el?.currentTime > .3 && el.webkitAudioDecodedByteCount > 0;
    });
    await p.getByRole("button", { name: "一時停止" }).click();
    assert.ok(await video.evaluate(el => el.paused));
    await p.getByRole("button", { name: "動画を再生する" }).click();
    const save = p.getByRole("link", { name: "記念イラストを保存する" });
    await save.waitFor({ timeout: 25000 });
    assert.equal(await p.locator("body").getAttribute("data-saw-flash"), "yes");
    assert.equal(await p.locator(".finale video").count(), 0);
    const downloadEvent = p.waitForEvent("download");
    await save.click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), "merry-christmas-2026.png");
    assert.deepEqual(await readFile(await download.path()), await readFile("assets/christmas/25/merry-christmas-2026.png"));
    await p.getByRole("button", { name: "もう一度見る" }).click();
    assert.ok(await video.evaluate(el => el.paused && el.currentTime === 0));
    await p.getByRole("button", { name: "動画を再生する" }).click();
    await p.getByRole("button", { name: "動画をスキップ" }).click();
    assert.equal(await p.locator(".finale video").count(), 0);
    await p.getByRole("link", { name: "ホームに戻る" }).click();
    await p.locator(".room-scene").waitFor();
    assert.equal(await p.locator("video").count(), 0);

    for (const device of ["Pixel 7", "iPhone 13"]) {
      const phone = await browser.newPage({ ...devices[device], reducedMotion: "reduce" });
      if (device === "iPhone 13") await phone.route("**" + videoPath, route => route.abort());
      await phone.goto(base + "/calendar/25");
      if (device === "Pixel 7") {
        await phone.getByRole("button", { name: "動画を再生する" }).tap();
        const phoneVideo = phone.locator(".finale video");
        await phone.waitForFunction(() => document.querySelector(".finale video")?.currentTime > 0);
        await phoneVideo.evaluate(el => { el.currentTime = el.duration - .3; });
      } else {
        await phone.getByRole("button", { name: "動画を再生する" }).tap();
        await phone.getByText(/動画を再生できませんでした/).waitFor();
        await phone.getByRole("button", { name: "動画をスキップ" }).tap();
      }
      const picture = phone.locator(".finale-picture");
      await picture.waitFor();
      await picture.evaluate(el => el.decode());
      assert.equal(await phone.locator(".finale-flash").count(), 0);
      assert.ok(await picture.evaluate(el => el.naturalWidth / el.naturalHeight > 1.77 &&
        getComputedStyle(el).objectFit === "contain" && el.getBoundingClientRect().right <= window.innerWidth));
      await phone.close();
    }
    console.log("Finale: JST release, video range/audio, flash, original PNG download, replay and mobile fallback passed.");
    await clock("2027-01-01T00:00:00");
    await p.goto(base);
    assert.equal(await p.locator("a.door").count(), 25);
    assert.equal(
      (await get("/art/20/christmas-market.webp?preview=2027-01-01")).status,
      404,
    );
    await p.goto(base + "/calendar/9");
    await p.getByRole("button",{name:/Bトルコ|B トルコ/}).click();
    await p.locator(".answer.success").waitFor();
    console.log(
      "Production: protected routes/assets, JST midnight live transition, game gates, archive and quiz passed.",
    );
  } finally {
    await browser?.close();
    child.kill();
  }
}
