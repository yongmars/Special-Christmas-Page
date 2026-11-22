import { useEffect, useRef, useState } from "react";
import { neighbors, shuffle, solved } from "@/lib/slide";
import { useProgress } from "@/lib/progress";

type SlideProps = { image: string; title: string; preview: boolean; onWin: () => void };

export function Slide({ image, title, preview, onWin }: SlideProps) {
  const [n, setSize] = useState(3);
  const [initial, setInitial] = useState<number[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [guide, setGuide] = useState(false);
  const replay = useRef<HTMLButtonElement>(null);
  const { state, recordSlideBest } = useProgress(preview);
  const best = state.slideBest[n];
  const win = board.length > 0 && solved(board);
  const blank = board.indexOf(n * n - 1);
  const adjacent = neighbors(blank, n);

  function reset(tiles: number[]) {
    setBoard(tiles);
    setMoves(0);
    setGuide(false);
  }
  function start(size: number) {
    const tiles = shuffle(size);
    setSize(size);
    setInitial(tiles);
    reset(tiles);
  }
  useEffect(() => { start(3); }, []);
  useEffect(() => {
    if (!guide) return;
    const timer = window.setTimeout(() => setGuide(false), 3000);
    return () => window.clearTimeout(timer);
  }, [guide]);
  useEffect(() => {
    if (win) replay.current?.focus({preventScroll: true});
  }, [win]);

  function move(index: number) {
    if (win || !adjacent.includes(index)) return;
    const next = [...board];
    [next[index], next[blank]] = [next[blank], next[index]];
    const count = moves + 1;
    setBoard(next);
    setMoves(count);
    if (solved(next)) {
      setGuide(false);
      recordSlideBest(n, count);
      onWin();
    }
  }

  return (
    <>
      <label>難易度{" "}
        <select value={n} onChange={e => start(Number(e.target.value))}>
          <option value="3">やさしい（3×3）</option>
          <option value="4">むずかしい（4×4）</option>
        </select>
      </label>
      <p className="game-stat" role="status">
        {win ? moves + " 手で絵が完成しました！" : "今回の手数 " + moves + " 手"}　／　ベスト記録 {best ? best + " 手" : "—"}
      </p>
      {win ? (
        <div className="slide-result">
          <h2>かんせい！</h2>
          <img src={image} alt={title}/>
          <p>{n === 3 ? "ノクト「完成だね。いい感じ。」" : "ルクス「やったー！そろった！」"}</p>
          <button ref={replay} className="action green" onClick={() => start(n)}>もう一度あそぶ</button>
        </div>
      ) : (
        <>
          <div className="slide-board" style={{ gridTemplateColumns: "repeat(" + n + ", 1fr)" }}>
            {board.map((value, i) => (
              <button key={value} className={i === blank ? "blank" : undefined}
                disabled={!adjacent.includes(i)}
                aria-label={i === blank ? "空白" : "ピース " + (value + 1)}
                onClick={() => move(i)}
                style={{
                  backgroundImage: "url(" + image + ")",
                  backgroundSize: n * 100 + "% " + n * 100 + "%",
                  backgroundPosition: (value % n) / (n - 1) * 100 + "% " + Math.floor(value / n) / (n - 1) * 100 + "%",
                }}>
                {i !== blank && <span>{value + 1}</span>}
              </button>
            ))}
          </div>
          <div className="game-actions slide-controls">
            <button onClick={() => start(n)}>シャッフル</button>
            <button onClick={() => reset(initial)}>リセット</button>
            <button aria-expanded={guide} onClick={() => setGuide(!guide)}>完成図を{guide ? "閉じる" : "見る"}</button>
          </div>
          {guide && <img className="guide-image" src={image} alt={title + "の完成見本"}/>}
        </>
      )}
    </>
  );
}
