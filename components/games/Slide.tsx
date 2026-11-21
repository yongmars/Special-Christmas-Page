import { useEffect, useState } from "react";
import { neighbors, shuffle, solved } from "@/lib/slide";
export function Slide({ image, onWin }: { image: string; onWin: () => void }) {
  const [n, size] = useState(3),
    [board, setBoard] = useState<number[]>([]),
    [moves, step] = useState(0),
    [guide, setGuide] = useState(false);
  function start(n: number) {
    setBoard(shuffle(n));
    step(0);
    setGuide(false);
  }
  useEffect(() => {
    start(n);
  }, [n]);
  const win = board.length > 0 && solved(board);
  function move(i: number) {
    const blank = board.indexOf(n * n - 1);
    if (win || !neighbors(blank, n).includes(i)) return;
    const next = [...board];
    [next[i], next[blank]] = [next[blank], next[i]];
    setBoard(next);
    step(moves + 1);
    if (solved(next)) onWin();
  }
  return (
    <>
      <label>
        難易度{" "}
        <select value={n} onChange={(e) => size(Number(e.target.value))}>
          <option value="3">やさしい（3×3）</option>
          <option value="4">むずかしい（4×4）</option>
        </select>
      </label>
      <p className="game-stat" role="status">
        {win ? "絵が完成しました！" : moves + " 手"}
      </p>
      <div
        className="slide-board"
        style={{ gridTemplateColumns: "repeat(" + n + ",1fr)" }}
      >
        {board.map((val, i) => (
          <button
            key={val}
            className={val === n * n - 1 && !win ? "blank" : ""}
            disabled={
              win || !neighbors(board.indexOf(n * n - 1), n).includes(i)
            }
            aria-label={"ピース " + (val + 1)}
            onClick={() => move(i)}
            style={{
              backgroundImage: "url(" + image + ")",
              backgroundSize: n * 100 + "% " + n * 100 + "%",
              backgroundPosition:
                ((val % n) / (n - 1)) * 100 +
                "% " +
                (Math.floor(val / n) / (n - 1)) * 100 +
                "%",
            }}
          >
            {val !== n * n - 1 && <span>{val + 1}</span>}
          </button>
        ))}
      </div>
      <div className="game-actions">
        <button onClick={() => start(n)}>シャッフル</button>
        <button aria-expanded={guide} onClick={() => setGuide(!guide)}>
          完成図を{guide ? "閉じる" : "見る"}
        </button>
      </div>
      {guide && (
        <img className="guide-image" src={image} alt="スライドパズル完成図" />
      )}
    </>
  );
}
