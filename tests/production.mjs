// This harness controls a separate local process, never the application's clock in deployment.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import http from "node:http";
import next from "next";
import { chromium } from "playwright";
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
      [3, "memory"], [10, "slide"], [13, "jigsaw"], [17, "sorting"], [20, "delivery"],
    ]) {
      await clock("2026-12-" + String(day - 1).padStart(2, "0") + "T23:59:55");
      assert.match(await body("/games/" + id), /に公開します/);
      await clock("2026-12-" + String(day).padStart(2, "0") + "T00:00:00");
      assert.match(await body("/games/" + id), day < 17 ? /あそぶ/ : /準備中です/);
      assert.match(await body("/calendar/" + day), /ゲームの入口へ/);
    }
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
