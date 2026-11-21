"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createShapes, isMatch, target } from "./geometry.mjs";
import { Icon } from "./Icons";

function relativeRect(element, origin) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
}

function placement(piece, shape, layout, n) {
  const { board, tray, cols } = layout;
  const cell = board.width / n;
  if (piece.placed) return { ...target(shape, board, n), scale: cell / 100 };
  if (piece.board) return {
    x: board.x + piece.board.x * board.width,
    y: board.y + piece.board.y * board.height,
    scale: cell / 100,
  };
  const slotWidth = tray.width / cols, slotHeight = tray.height / Math.ceil(n * n / cols);
  return {
    x: tray.x + (piece.slot % cols + 0.5) * slotWidth,
    y: tray.y + (Math.floor(piece.slot / cols) + 0.5) * slotHeight,
    scale: Math.min(slotWidth, slotHeight) * 0.67 / 100,
  };
}

export default function PuzzleSurface({ config, pieces, setPieces, guide, hint, completed }) {
  const n = config.size;
  const shapes = useMemo(() => createShapes(n), [n]);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const boardRef = useRef(null), trayRef = useRef(null), overlayRef = useRef(null);
  const gesture = useRef(null);
  const [layout, setLayout] = useState(null);
  const [drag, setDrag] = useState(null);
  const [front, setFront] = useState(null);
  const [lastPlaced, setLastPlaced] = useState(null);
  const placedCount = pieces.filter(p => p.placed).length;

  useLayoutEffect(() => {
    const measure = () => {
      const origin = overlayRef.current.getBoundingClientRect();
      const tray = trayRef.current;
      const cols = Number(getComputedStyle(tray).getPropertyValue("--tray-cols")) || n;
      setLayout({ board: relativeRect(boardRef.current, origin), tray: relativeRect(tray, origin), cols });
      gesture.current = null;
      setDrag(null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    [boardRef.current, trayRef.current, overlayRef.current].forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [n]);

  useEffect(() => {
    if (lastPlaced === null) return;
    const timer = setTimeout(() => setLastPlaced(null), 420);
    return () => clearTimeout(timer);
  }, [lastPlaced]);

  const commit = useCallback((piece, point, angle) => {
    const board = layout.board, shape = shapes[piece.id];
    const inside = point.x >= board.x && point.y >= board.y &&
      point.x <= board.x + board.width && point.y <= board.y + board.height;
    const placed = inside && isMatch(point, target(shape, board, n), angle, board.width / n);
    const resting = inside && !placed ? {
      x: (point.x - board.x) / board.width, y: (point.y - board.y) / board.height,
    } : null;
    if (placed) setLastPlaced(piece.id);
    setPieces(current => current.map(p => p.id === piece.id ? { ...p, placed, angle, board: resting } : p));
  }, [layout, shapes, n, setPieces]);

  function start(e, piece, pos) {
    if (!e.isPrimary || e.button !== 0 || gesture.current || piece.placed) return;
    e.preventDefault();
    const origin = overlayRef.current.getBoundingClientRect();
    gesture.current = {
      pointer: e.pointerId, id: piece.id, startX: e.clientX, startY: e.clientY, started: performance.now(),
      offsetX: (e.clientX - origin.left - pos.x) / pos.scale,
      offsetY: (e.clientY - origin.top - pos.y) / pos.scale, moved: false,
    };
    overlayRef.current.setPointerCapture(e.pointerId);
    setFront(piece.id);
  }

  function readMovement(e, g) {
    if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 4) g.moved = true;
    const rect = overlayRef.current.getBoundingClientRect(), scale = layout.board.width / n / 100;
    return { id: g.id, x: e.clientX - rect.left - g.offsetX * scale,
      y: e.clientY - rect.top - g.offsetY * scale, scale };
  }

  function move(e) {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    const point = readMovement(e, g);
    if (g.moved) setDrag(point);
  }

  function end(e) {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    const piece = pieces[g.id], point = readMovement(e, g);
    if (g.moved) commit(piece, point, piece.angle);
    else if (performance.now() - g.started < 360) {
      commit(piece, placement(piece, shapes[piece.id], layout, n), (piece.angle + 90) % 360);
    }
    cancel(e);
  }

  function cancel(e) {
    if (gesture.current?.pointer !== e.pointerId) return;
    gesture.current = null;
    setDrag(null);
    if (overlayRef.current.hasPointerCapture(e.pointerId)) overlayRef.current.releasePointerCapture(e.pointerId);
  }

  function keyboard(e, piece, pos) {
    if (gesture.current) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(piece, pos, (piece.angle + 90) % 360);
      return;
    }
    const step = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (!step) return;
    e.preventDefault();
    setFront(piece.id);
    const board = layout.board, cell = board.width / n;
    const index = value => Math.max(0, Math.min(n - 1, value));
    const col = piece.board ? index(Math.floor(piece.board.x * n) + step[0]) : 0;
    const row = piece.board ? index(Math.floor(piece.board.y * n) + step[1]) : 0;
    commit(piece, { x: board.x + (col + 0.5) * cell, y: board.y + (row + 0.5) * cell }, piece.angle);
  }

  const order = [...pieces].sort((a, b) => Number(b.placed) - Number(a.placed) || Number(a.id === front) - Number(b.id === front));
  return <div className="jg-surface" style={{ "--size": n, "--compact-cols": Math.ceil(n * n / (n === 3 ? 2 : 3)) }}>
    <section className="jg-panel jg-board-panel" aria-label="完成エリア">
      <div className="jg-panel-head"><h2><Icon name="grid" />完成エリア</h2>
        <div className="jg-count" aria-live="polite"><span className="jg-meter"><i style={{ width: (placedCount / (n * n) * 100) + "%" }}/></span><b>{placedCount}</b> / {n * n}</div>
      </div>
      <div className="jg-frame"><div ref={boardRef} className="jg-board">
        <img className={completed ? "solved" : guide ? "guide" : ""} src={config.image} alt={completed ? config.illustrationTitle : ""} draggable="false"/>
        {!completed && <svg viewBox={`0 0 ${n * 100} ${n * 100}`} aria-hidden="true">
          {shapes.map(s => <path key={s.id} transform={`translate(${s.col * 100} ${s.row * 100})`} d={s.path} className={s.id === hint ? "jg-target highlighted" : "jg-target"}/>)}
        </svg>}
      </div></div>
    </section>
    <section className="jg-panel jg-tray-panel" aria-label="ピース置き場">
      <div className="jg-panel-head"><h2><Icon name="puzzle" />ピース置き場</h2><span className="jg-remaining">のこり {n * n - placedCount} 個</span></div>
      <div className="jg-tray" ref={trayRef}>
        {Array.from({ length: n * n }, (_, i) => <i key={i} aria-hidden="true"/>)}
      </div>
    </section>
    <svg ref={overlayRef} className="jg-overlay" onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel}>
      <defs>
        <image id={uid + "art"} href={config.image} width={n * 100} height={n * 100} preserveAspectRatio="xMidYMid slice"/>
        {shapes.map(s => <clipPath key={s.id} id={uid + "clip" + s.id}><path d={s.path}/></clipPath>)}
      </defs>
      {layout && !completed && order.map(piece => {
        const s = shapes[piece.id];
        const pos = drag?.id === piece.id ? drag : placement(piece, s, layout, n);
        const interactive = !piece.placed;
        return <g key={s.id} className={"jg-piece" + (interactive ? " loose" : "") + (hint === s.id ? " hinted" : "") + (lastPlaced === s.id ? " clicked-in" : "")}
          data-piece={s.id} data-angle={piece.angle} data-placed={piece.placed}
          transform={`translate(${pos.x} ${pos.y}) rotate(${piece.angle}) scale(${pos.scale}) translate(-50 -50)`}
          role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined}
          aria-label={interactive ? `ピース ${s.id + 1}、${piece.angle}度` : undefined}
          aria-describedby={interactive ? uid + "keys" : undefined}
          onPointerDown={interactive ? e => start(e, piece, pos) : undefined}
          onKeyDown={interactive ? e => keyboard(e, piece, pos) : undefined}>
          <g clipPath={`url(#${uid}clip${s.id})`}><use href={"#" + uid + "art"} x={-s.col * 100} y={-s.row * 100}/></g>
          <path className="jg-piece-edge" d={s.path} vectorEffect="non-scaling-stroke"/>
        </g>;
      })}
    </svg>
    <span className="jg-sr" id={uid + "keys"}>矢印キーで盤面に移動し、マスを選びます。Enterキーまたはスペースキーで回転します。</span>
  </div>;
}
