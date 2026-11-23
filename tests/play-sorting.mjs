import assert from "node:assert/strict";

const correctBin = {
  "クマのぬいぐるみ": "plush", "ウサギのぬいぐるみ": "plush", "ネコのぬいぐるみ": "plush",
  "自動車": "vehicle", "電車": "vehicle", "飛行機": "vehicle",
  "キャンディ": "sweet", "クッキー": "sweet", "チョコレート": "sweet",
};

async function stat(page, label) {
  return (await page.locator(".sort-stats div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd").innerText()).trim();
}

async function handleMovingItem(page, target, touch, drag) {
  const piece = page.locator(".sort-piece");
  await piece.evaluate(el => el.scrollIntoView({ block: "center" }));
  const box = await piece.boundingBox(), bin = await target.boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const endX = bin.x + bin.width / 2, endY = bin.y + bin.height / 2;
  assert.ok(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest(".sort-piece") != null, [x, y]));
  if (touch && drag) {
    const cdp = await page.context().newCDPSession(page);
    const finger = (type, points) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: points});
    await finger("touchStart", [{ x, y, id: 1 }]);
    await finger("touchMove", [{ x: endX, y: endY, id: 1 }]);
    await page.locator(".sort-in-hand:visible").waitFor();
    await finger("touchEnd", []);
    await cdp.detach();
  } else if (touch) await page.touchscreen.tap(x, y);
  else if (drag) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 6 });
    await page.locator(".sort-in-hand:visible").waitFor();
    await page.mouse.up();
  } else await page.mouse.click(x, y);
}

export async function playSorting(page, touch, { wrong = [], timeout = [], deadlineTap = [], checkPause = false } = {}) {
  const names = new Set();
  let score = 0, combo = 0, best = 0, misses = 0;
  for (let i = 0; i < 15; i++) {
    const piece = page.locator(".sort-piece");
    await page.waitForFunction(n => document.querySelector("progress")?.value === n, i + 1);
    const name = await page.locator(".sort-label").innerText();
    const id = correctBin[name];
    names.add(name);
    assert.ok(id);
    const duration = i < 5 ? 6000 : i < 10 ? 5000 : 4000;
    assert.equal(await piece.evaluate(el => el.getAnimations()[0].effect.getTiming().duration), duration);
    if (checkPause && i === 0) {
      const x = (await piece.boundingBox()).x;
      await page.waitForFunction(x => document.querySelector(".sort-piece").getBoundingClientRect().x > x + 4, x);
      for (const automatic of [false, true]) {
        if (automatic) {
          // Exercise the same visibility event delivered when switching browser tabs.
          await page.evaluate(() => {
            Object.defineProperty(document, "hidden", { configurable: true, value: true });
            document.dispatchEvent(new Event("visibilitychange"));
            delete document.hidden;
            document.dispatchEvent(new Event("visibilitychange"));
          });
        } else await page.getByRole("button", { name: "一時停止" }).click();
        const resume = page.getByRole("button", { name: "再開", exact: true });
        await resume.waitFor();
        const time = () => piece.evaluate(el => el.getAnimations()[0].currentTime);
        await piece.evaluate(el => el.getAnimations()[0].ready);
        const t = await time(), stoppedX = (await piece.boundingBox()).x;
        await page.locator('[data-bin="' + id + '"]').evaluate(el => el.click());
        await page.waitForTimeout(automatic ? 6300 : 160);
        assert.equal(await time(), t);
        assert.equal((await piece.boundingBox()).x, stoppedX);
        assert.equal(await stat(page, "ミス"), "0");
        assert.equal(await stat(page, "正解"), "0");
        await resume.click();
        assert.ok(await time() < t + 350);
      }
    }
    const failed = wrong.includes(i) || timeout.includes(i) || deadlineTap.includes(i);
    const target = wrong.includes(i) ? page.locator('.sort-box:not([data-bin="' + id + '"])').first()
      : page.locator('[data-bin="' + id + '"]');
    if (i === 4) {
      await handleMovingItem(page, target, touch, false);
      assert.equal(await piece.getAttribute("aria-pressed"), "true");
      await page.getByText("選択中。入れる箱をタップ！").waitFor();
    }
    if (timeout.includes(i)) {
      // Leave the item on the belt through the real deadline.
      await page.getByText("右端に到着！ 次の品物へ").waitFor({ timeout: duration + 2000 });
    } else if (deadlineTap.includes(i)) {
      // Deliver the right answer at the exact endpoint, before the queued finish event.
      await target.evaluate(button => {
        const animation = document.querySelector(".sort-piece").getAnimations()[0];
        animation.currentTime = animation.effect.getTiming().duration;
        button.click();
        button.click();
      });
      await page.getByText("右端に到着！ 次の品物へ").waitFor();
    } else if (i === 5) {
      await handleMovingItem(page, target, touch, true);
    } else if (i === 1) {
      await target.evaluate(el => { el.click(); el.click(); });
    } else if (!touch && i === 2) await target.press("Enter");
    else if (touch) await target.tap();
    else await target.click();
    if (failed) { misses++; combo = 0; }
    else {
      combo++;
      best = Math.max(best, combo);
      score += 100 + Math.min(combo - 1, 4) * 20;
    }
    if (i < 14) {
      await page.waitForFunction(n => document.querySelector("progress")?.value === n, i + 2);
      assert.equal(await stat(page, "スコア"), String(score));
      assert.equal(await stat(page, "ミス"), String(misses));
      assert.equal(await stat(page, "正解"), String(i + 1 - misses));
      assert.equal(parseInt(await stat(page, "コンボ")), combo);
    }
  }
  assert.equal(names.size, 9);
  const correct = 15 - misses;
  await page.getByRole("heading", { name: correct >= 12 ? "ゲームクリア！" : "もう一度挑戦！" }).waitFor();
  assert.equal(await stat(page, "最終スコア"), String(score));
  assert.equal(await stat(page, "最大コンボ"), String(best));
  assert.equal(await stat(page, "正解"), correct + " / 15");
  assert.equal(await stat(page, "ミス"), String(misses));
  const grade = correct === 15 ? "S" : correct >= 13 ? "A" : correct === 12 ? "B" : "C";
  await page.getByLabel(grade + "ランク").waitFor();
  assert.equal(await page.locator(".sort-game").evaluate(el =>
    el.getAnimations({subtree: true}).filter(a => a.effect.getTiming().iterations === Infinity).length), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
