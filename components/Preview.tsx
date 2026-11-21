import { Context, Game, GameId } from "@/lib/types";
import { useState } from "react";
export function Preview({
  ctx,
  games,
  state,
  opened,
  clear,
  reset,
}: {
  ctx: Context;
  games: Game[];
  state: { opened: number[]; clears: GameId[] };
  opened: (d: number, yes: boolean) => void;
  clear: (g: GameId, yes: boolean) => void;
  reset: () => void;
}) {
  const [day, setDay] = useState(1);
  return (
    <details className="preview-tools">
      <summary>
        開発プレビュー　{ctx.date.replaceAll("-", "/")}　・　設定
      </summary>
      <div className="tools-inner">
        <form>
          <label>
            確認する日本時間の日付{" "}
            <input type="date" name="date" defaultValue={ctx.date} required />
          </label>{" "}
          <button>日付を適用</button>
        </form>
        <label>
          扉の記録{" "}
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {ctx.doors.map((d) => (
              <option key={d.day} value={d.day}>
                {d.day}日
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.opened.includes(day)}
            onChange={(e) => opened(day, e.target.checked)}
          />{" "}
          開封済み
        </label>
        <fieldset>
          <legend>クリア記録</legend>
          {games.map((g) => (
            <label key={g.id}>
              <input
                type="checkbox"
                checked={state.clears.includes(g.id)}
                onChange={(e) => clear(g.id, e.target.checked)}
              />{" "}
              {g.title}
            </label>
          ))}
        </fieldset>
        <button onClick={reset}>プレビュー記録をリセット</button>
        <a className="backlink" href="/">
          通常のお部屋へ
        </a>
      </div>
    </details>
  );
}
