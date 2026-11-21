import { useEffect, useState } from "react";
import type { Face } from "@/lib/types";
function shuffled(n: number) {
  const cards = Array.from({ length: n * 2 }, (_, i) => i % n);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function Memory({
  faces,
  backFile,
  onWin,
}: {
  faces: Face[];
  backFile?: string;
  onWin: () => void;
}) {
  const [cards, setCards] = useState<number[]>([]),
    [up, flip] = useState<number[]>([]),
    [done, match] = useState<number[]>([]);
  function reset() {
    setCards(shuffled(faces.length));
    flip([]);
    match([]);
  }
  useEffect(() => {
    reset();
  }, [faces.length]);
  useEffect(() => {
    if (up.length !== 2) return;
    const timer = setTimeout(() => flip([]), 750);
    return () => clearTimeout(timer);
  }, [up]);
  function pick(i: number) {
    if (up.includes(i) || done.includes(i) || up.length > 1) return;
    if (up.length === 1 && cards[i] === cards[up[0]]) {
      const next = [...done, up[0], i];
      match(next);
      flip([]);
      if (next.length === cards.length) onWin();
    } else flip([...up, i]);
  }
  const won = cards.length > 0 && done.length === cards.length;
  return (
    <>
      <div className="game-stat" aria-live="polite">
        {won
          ? "すべてのペアがそろいました！"
          : done.length / 2 + " / " + faces.length + " ペア"}
      </div>
      <div className="memory-board">
        {cards.map((val, i) => {
          const face = faces[val],
            show = up.includes(i) || done.includes(i);
          return (
            <button
              key={i}
              className={show ? "flipped" : ""}
              disabled={show || up.length === 2}
              aria-label={show ? face.name : i + 1 + "枚目をめくる"}
              onClick={() => pick(i)}
            >
              {show ? (
                face.file ? (
                  <img src={face.file} alt={face.name} />
                ) : (
                  face.symbol
                )
              ) : backFile ? (
                <img src={backFile} alt="" />
              ) : (
                "✣"
              )}
            </button>
          );
        })}
      </div>
      <button className="secondary" onClick={reset}>
        もう一度あそぶ
      </button>
    </>
  );
}
