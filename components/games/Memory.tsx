import { useEffect, useRef, useState } from "react";
import type { Face } from "@/lib/types";
function shuffled(n: number) {
  const cards = Array.from({ length: n * 2 }, (_, i) => i % n);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
function PairPreview({ face, onClose }: { face: Face; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let closeTimer: ReturnType<typeof setTimeout>;
    const openTimer = setTimeout(() => {
      dialog.showModal();
      closeTimer = setTimeout(() => dialog.close(), 2000);
    }, reducedMotion ? 0 : 450);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);
  return (
    <dialog ref={ref} className="memory-preview" aria-label={face.name + "のペアがそろったよ！"}
      onClick={() => ref.current?.close()} onClose={onClose}>
      {face.file ? <img src={face.file} alt={face.name} /> : <span>{face.symbol}</span>}
      <button type="button">タップして閉じる · 2秒で戻る</button>
    </dialog>
  );
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
    [done, match] = useState<number[]>([]),
    [preview, setPreview] = useState<Face | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  function reset() {
    setCards(shuffled(faces.length));
    flip([]);
    match([]);
    setPreview(null);
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
    if (preview || up.includes(i) || done.includes(i) || up.length > 1) return;
    if (up.length === 1 && cards[i] === cards[up[0]]) {
      const next = [...done, up[0], i];
      match(next);
      flip([]);
      setPreview(faces[cards[i]]);
      if (next.length === cards.length) onWin();
    } else flip([...up, i]);
  }
  const won = cards.length > 0 && done.length === cards.length;
  return (
    <>
      <div ref={status} className="game-stat" aria-live="polite" tabIndex={-1}>
        {won && !preview
          ? "すべてのペアがそろいました！"
          : done.length / 2 + " / " + faces.length + " ペア"}
      </div>
      <div ref={board} className="memory-board">
        {cards.map((val, i) => {
          const face = faces[val],
            show = up.includes(i) || done.includes(i);
          return (
            <button
              key={i}
              className={show ? "flipped" : ""}
              disabled={show || up.length === 2 || preview !== null}
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
      {preview && (
        <PairPreview face={preview} onClose={() => {
          setPreview(null);
          requestAnimationFrame(() => {
            const next = board.current?.querySelector<HTMLButtonElement>("button:enabled");
            (next ?? status.current)?.focus({ preventScroll: !won });
          });
        }} />
      )}
      <button className="secondary" onClick={reset}>
        もう一度あそぶ
      </button>
    </>
  );
}
