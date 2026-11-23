import assert from "node:assert/strict";

const correctBin = {
  "クマのぬいぐるみ": "plush", "ウサギのぬいぐるみ": "plush", "ネコのぬいぐるみ": "plush",
  "自動車": "vehicle", "電車": "vehicle", "飛行機": "vehicle",
  "キャンディ": "sweet", "クッキー": "sweet", "チョコレート": "sweet",
};
export async function playSorting(page, touch) {
  const label = page.locator(".sort-label");
  const seen = new Set();
  for (let i = 0; i < 15; i++) {
    const name = await label.innerText();
    const id = correctBin[name];
    assert.ok(id, name);
    seen.add(name);
    const target = page.locator('[data-bin="' + id + '"]');
    if (i === 0) {
      const wrong = page.locator('.sort-box:not([data-bin="' + id + '"])').first();
      if (touch) await wrong.tap();
      else await wrong.click();
      await page.getByText("おっと、違う箱みたい！").waitFor();
      assert.equal(await label.innerText(), name);
      assert.equal(await page.locator("progress").getAttribute("value"), "0");
      const piece = page.locator(".sort-piece");
      await piece.evaluate(el => el.scrollIntoView({ block: "center" }));
      const bounds = await target.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44);
      if (touch) {
        const box = await piece.boundingBox();
        const cdp = await page.context().newCDPSession(page);
        const finger = (type, x, y) => cdp.send("Input.dispatchTouchEvent", {
          type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }],
        });
        await finger("touchStart", box.x + box.width / 2, box.y + box.height / 2);
        await finger("touchMove", bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await finger("touchEnd");
        await cdp.detach();
      } else {
        const box = await piece.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, { steps: 6 });
        await page.mouse.up();
      }
    } else if (i === 1) {
      // A second event may arrive before the UI has committed its disabled state.
      await target.evaluate(el => { el.click(); el.click(); });
    } else if (!touch && i === 2) {
      await target.press("Enter");
    } else if (touch) await target.tap();
    else await target.click();
    await page.waitForFunction(n => document.querySelector("progress")?.value === n, i + 1, { timeout: 4000 }).catch(async err => {
      throw Error(`品物 ${i + 1}（${name}）の仕分けに失敗: ${await page.locator(".sort-body").innerText()}`, { cause: err });
    });
    if (i < 14) await page.waitForFunction(previous =>
      document.querySelector(".sort-label")?.textContent !== previous, name);
  }
  assert.equal(seen.size, 9);
  await page.getByRole("heading", { name: "ゲームクリア！" }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
