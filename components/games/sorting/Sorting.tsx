import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@/lib/navigation";
import { publicPath } from "@/lib/public-path";
import { bins, makeSortingRound, type BinId } from "@/lib/sorting";
import { url, type Context, type Game } from "@/lib/types";
import { Character } from "../../Character";
import { Icon } from "../../Icon";
import { ItemArt } from "./SortingArt";
import "./sorting.css";

function Parcel() {
  return <span className="sort-parcel" aria-hidden="true"><i /></span>;
}

function Dialogue({ done }: { done: boolean }) {
  return <div className="sort-dialogue">
    <p><b>ノクト</b>{done ? "全部仕分けられたね。おつかれさま！" : "サンタさんのお手伝い、始めようか"}</p>
    <p><b>ルクス</b>{done ? "これでプレゼントの準備はばっちり！" : "プレゼントをどんどん仕分けるよ！"}</p>
  </div>;
}

type Drag = { pointer: number; x: number; y: number };
export function Sorting({ ctx, game, onWin }: { ctx: Context; game: Game; onWin: () => void }) {
  const [round, setRound] = useState<ReturnType<typeof makeSortingRound>>([]);
  const [index, setIndex] = useState(0);
  const [packing, setPacking] = useState(false);
  const [message, setMessage] = useState("");
  const piece = useRef<HTMLDivElement>(null);
  const boxes = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const drag = useRef<Drag | null>(null);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const item = round[index];
  const done = round.length > 0 && !item;
  const sorted = index + Number(packing);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (done) title.current?.focus({ preventScroll: true });
  }, [done]);

  function start() {
    setRound(makeSortingRound());
    setIndex(0);
    setMessage("");
    requestAnimationFrame(() => boxes.current?.querySelector("button")?.focus({ preventScroll: true }));
  }

  function choose(bin: BinId) {
    const el = piece.current;
    if (!item || !el || busy.current) return;
    if (bin !== item.bin) {
      el.style.transform = "";
      setMessage("おっと、違う箱みたい！");
      return;
    }
    busy.current = true;
    drag.current = null;
    setPacking(true);
    setMessage("正解！ " + ["ノクト「いい調子だね」", "ルクス「やった！」", "ルクス「次、いってみよう！」"][index % 3]);
    if (index + 1 === round.length) onWin();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = boxes.current!.querySelector<HTMLElement>('[data-bin="' + bin + '"]')!;
    const from = el.getBoundingClientRect();
    el.style.transform = "";
    const origin = el.getBoundingClientRect();
    const to = box.getBoundingClientRect();
    const dx = to.left + to.width / 2 - origin.left - origin.width / 2;
    const dy = to.top + to.height * 0.25 - origin.top - origin.height / 2;
    if (!reduced) {
      el.animate([
        { transform: `translate(${from.left - origin.left}px, ${from.top - origin.top}px)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0 },
      ], { duration: 350, easing: "ease-in", fill: "forwards" });
    }
    timer.current = window.setTimeout(() => {
      setIndex(index + 1);
      setPacking(false);
      setMessage("");
      busy.current = false;
    }, reduced ? 320 : 840);
  }

  function grab(e: PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary || e.button !== 0 || busy.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.pointer !== e.pointerId) return;
    e.currentTarget.style.transform = `translate(${e.clientX - d.x}px, ${e.clientY - d.y}px)`;
  }
  function drop(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== e.pointerId) return;
    drag.current = null;
    const bin = bins.find(({ id }) => containsPointer(boxes.current!.querySelector('[data-bin="' + id + '"]')!, e));
    if (bin) choose(bin.id);
    else e.currentTarget.style.transform = "";
  }

  return <article className="sort-game" aria-label={game.title}>
    <header className="sort-head">
      <div className="sort-date"><Icon name="calendar" size={16} />12.13 <span>SUN</span></div>
      <h1><small>サンタのお手伝い！</small><span>プレゼント</span><span>仕分けゲーム</span></h1>
      <p>{game.intro}</p>
    </header>
    <div className="sort-body">
      <div className="sort-progress">
        <strong>仕分け済み <b>{sorted}</b> / 15</strong>
        <progress value={sorted} max="15" aria-label="仕分け済み" />
      </div>
      <div className="sort-stage">
        <img className="sort-scenery" src={publicPath("/images/christmas/sorting-workshop.svg")} alt="" />
        <div className="sort-cat sort-noct"><Character who="noct" mirrored /></div>
        <div className="sort-cat sort-lux"><Character who="lux" /></div>
        {item ? <>
          <span className="sort-label" aria-live="polite">{item.name}</span>
          <div className={"sort-piece" + (packing ? " packing" : "")} key={index} ref={piece}
            onPointerDown={grab} onPointerMove={move} onPointerUp={drop}
            onLostPointerCapture={e => {
              if (drag.current?.pointer === e.pointerId) {
                drag.current = null;
                e.currentTarget.style.transform = "";
              }
            }}>
            <span><ItemArt id={item.id} /></span>
          </div>
        </> : <div className="sort-display"><Parcel /></div>}
        <div className="sort-belt" aria-hidden="true"><i /><span /></div>
      </div>
      {item ? <>
        <p className="sort-feedback" role="status">{message || "どの箱に入れる？"}</p>
        <div className="sort-boxes" ref={boxes}>
          {bins.map(bin => <button key={bin.id} type="button" data-bin={bin.id}
            aria-disabled={packing}
            onPointerUp={e => {
              if (e.pointerType === "touch" && e.isPrimary && containsPointer(e.currentTarget, e)) choose(bin.id);
            }}
            onClick={e => {
              // Touch is handled on release. Keep native clicks for mouse and assistive input.
              if (!("pointerType" in e.nativeEvent) || e.nativeEvent.pointerType !== "touch") choose(bin.id);
            }}
            className={"sort-box" + (packing && item.bin === bin.id ? " wrapping" : "")}>
            <span className="sort-bin-icon"><ItemArt id={bin.icon} /></span>
            <strong>{bin.label}</strong>
            {packing && item.bin === bin.id && <span className="sort-wrapped" aria-hidden="true"><Parcel /></span>}
          </button>)}
        </div>
      </> : <div className="sort-welcome">
        {done && <h2 tabIndex={-1} ref={title}>ゲームクリア！</h2>}
        <Dialogue done={done} />
        <button type="button" className="action green sort-start" onClick={start}>
          <Icon name={done ? "game" : "gift"} size={20} />
          {done ? "もう一度あそぶ" : ctx.preview ? "試遊する" : "あそぶ"}
        </button>
      </div>}
      <Link prefetch={false} className={done ? "sort-home action" : "sort-home backlink"} href={url(ctx)}>
        お部屋に戻る
      </Link>
    </div>
  </article>;
}

function containsPointer(element: Element, point: { clientX: number; clientY: number }) {
  const r = element.getBoundingClientRect();
  return point.clientX >= r.left && point.clientX <= r.right && point.clientY >= r.top && point.clientY <= r.bottom;
}
