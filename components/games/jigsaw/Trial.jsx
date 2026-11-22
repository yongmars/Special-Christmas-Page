"use client";
import { useEffect, useRef, useState } from "react";
import { shufflePieces } from "./geometry.mjs";
import PuzzleSurface from "./PuzzleSurface";
import "./jigsaw.css";
export default function Trial({ image, illustrationTitle, onWin }) {
  const [pieces, set] = useState([]),
    [guide, setGuide] = useState(true);
  const win = pieces.length > 0 && pieces.every((p) => p.placed);
  const recorded = useRef(false);
  useEffect(() => set(shufflePieces(3)), []);
  useEffect(() => {
    if (!win) {
      recorded.current = false;
      return;
    }
    if (!recorded.current) {
      recorded.current = true;
      onWin();
    }
  }, [win, onWin]);
  return (
    <div className="jg-app trial">
      <p>ドラッグではめる　·　タップで90度回転</p>
      <PuzzleSurface
        config={{ size: 3, image, illustrationTitle }}
        pieces={pieces}
        setPieces={set}
        guide={guide}
        hint={null}
        completed={win}
      />
      <div className="game-actions">
        <button onClick={() => setGuide(!guide)} aria-pressed={guide}>
          完成見本 {guide ? "オン" : "オフ"}
        </button>
        <button onClick={() => set(shufflePieces(3))}>もう一度あそぶ</button>
      </div>
      {win && <h2 role="status">かんせい！</h2>}
    </div>
  );
}
