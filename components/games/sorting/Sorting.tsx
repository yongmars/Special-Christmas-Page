import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@/lib/navigation";
import { publicPath } from "@/lib/public-path";
import { bins, comboPoints, crossingTime, emptyScore, makeSortingRound, rank, scoreItem, type BinId, type Outcome, type SortingScore } from "@/lib/sorting";
import { url, type Context, type Game } from "@/lib/types";
import { Character } from "../../Character";
import { Icon } from "../../Icon";
import { ItemArt } from "./SortingArt";
import "./sorting.css";

function Parcel() {
  return <span className="sort-parcel" aria-hidden="true"><i /></span>;
}

function Dialogue({ correct }: { correct?: number }) {
  let noct = "サンタさんのお手伝い、始めようか";
  let lux = "プレゼントをどんどん仕分けるよ！";
  if (correct !== undefined) {
    noct = correct === 15 ? "全部仕分けられたね。おつかれさま！" : "仕分けのお手伝い、おつかれさま！";
    lux = correct >= 12 ? "これでプレゼントの準備はばっちり！" : "次もいっしょにお手伝いしよう！";
  }
  return <div className="sort-dialogue"><p><b>ノクト</b>{noct}</p><p><b>ルクス</b>{lux}</p></div>;
}

function Scoreboard({ stats, result = false }: { stats: SortingScore; result?: boolean }) {
  const values = [
    [result ? "最終スコア" : "スコア", stats.score],
    ["正解", result ? stats.correct + " / 15" : stats.correct],
    ["ミス", stats.misses],
    [result ? "最大コンボ" : "コンボ", result ? stats.bestCombo : stats.combo],
  ] as const;
  return <dl className="sort-stats">{values.map(([label, value]) =>
    <div key={label} className={label === "コンボ" && stats.combo >= 3 ? "sort-streak" : undefined}>
      <dt>{label}</dt><dd>{value}{label === "コンボ" && stats.combo >= 3 && <small> COMBO!</small>}</dd>
    </div>)}</dl>;
}

type PhaseClock = { animation: Animation; duration: number; finish: () => void };
type Grip = { id: number; x: number; y: number; offsetX: number; offsetY: number; moved: boolean };
export function Sorting({ ctx, game, onWin }: { ctx: Context; game: Game; onWin: () => void }) {
  const [round, setRound] = useState<ReturnType<typeof makeSortingRound>>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState(emptyScore);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState(false);
  const frozen = useRef(false);
  const clock = useRef<PhaseClock | null>(null);
  const piece = useRef<HTMLButtonElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const grip = useRef<Grip | null>(null);
  const dropOrigin = useRef<DOMRect | null>(null);
  const boxes = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const item = round[index];
  const done = round.length > 0 && !item;
  const grade = rank(stats.correct);

  function releaseGrip() {
    const held = grip.current;
    grip.current = null;
    if (ghost.current) ghost.current.hidden = true;
    piece.current?.removeAttribute("data-held");
    if (held && piece.current?.hasPointerCapture(held.id)) piece.current.releasePointerCapture(held.id);
  }

  function pause() {
    if (!clock.current || frozen.current) return;
    frozen.current = true;
    clock.current.animation.pause();
    releaseGrip();
    setPaused(true);
  }
  function resume() {
    const phase = clock.current;
    if (!phase || document.hidden || !frozen.current) return;
    frozen.current = false;
    setPaused(false);
    // Calling play() on an already finished animation rewinds it.
    if (Number(phase.animation.currentTime) >= phase.duration) phase.finish();
    else phase.animation.play();
  }
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pause);
    };
  }, []);

  function start() {
    frozen.current = false;
    setPaused(false);
    setIndex(0);
    setStats(emptyScore);
    setOutcome(null);
    setSelected(false);
    setRound(makeSortingRound());
  }

  function judge(bin: BinId | null, fromHand: DOMRect | null = null) {
    const phase = clock.current;
    const el = piece.current;
    if (!phase || !el || !item || outcome || frozen.current) return;
    if (document.hidden) { pause(); return; }
    // The rendered animation is also the deadline clock, including at a frame boundary.
    const fraction = Math.min(1, Number(phase.animation.currentTime) / phase.duration);
    const answer: Outcome = fraction >= 1 || bin === null ? "timeout" : bin === item.bin ? "correct" : "wrong";
    clock.current = null;
    dropOrigin.current = fromHand;
    releaseGrip();
    setSelected(false);
    el.style.left = (fraction * 100) + "%";
    phase.animation.cancel();
    const next = scoreItem(stats, answer);
    setStats(next);
    setOutcome(answer);
    if (index + 1 === round.length && rank(next.correct) !== "C") onWin();
  }

  function pickUp(e: PointerEvent<HTMLButtonElement>) {
    if (!e.isPrimary || e.button !== 0 || !clock.current || outcome || frozen.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    grip.current = { id: e.pointerId, x: e.clientX, y: e.clientY,
      offsetX: rect.left - e.clientX, offsetY: rect.top - e.clientY, moved: false };
  }
  function moveHeld(e: PointerEvent<HTMLButtonElement>) {
    const held = grip.current, copy = ghost.current;
    if (!held || held.id !== e.pointerId || !copy) return;
    if (!held.moved && Math.hypot(e.clientX - held.x, e.clientY - held.y) < 5) return;
    held.moved = true;
    e.currentTarget.dataset.held = "true";
    copy.style.left = e.clientX + held.offsetX + "px";
    copy.style.top = e.clientY + held.offsetY + "px";
    copy.hidden = false;
  }
  function place(e: PointerEvent<HTMLButtonElement>) {
    const held = grip.current;
    if (!held || held.id !== e.pointerId) return;
    if (!held.moved) {
      setSelected(true);
    } else {
      const bin = bins.find(({ id }) => containsPointer(boxes.current!.querySelector('[data-bin="' + id + '"]')!, e));
      if (bin) judge(bin.id, ghost.current!.getBoundingClientRect());
    }
    releaseGrip();
  }

  useLayoutEffect(() => {
    const el = piece.current;
    if (!item || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let duration = crossingTime(index);
    let frames: Keyframe[] = [{ left: "0%" }, { left: "100%" }];
    if (outcome) {
      duration = outcome === "correct" ? 620 : 430;
      frames = [{ opacity: 1 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }];
      if (outcome === "correct" && !reduced) {
        const target = boxes.current!.querySelector('[data-bin="' + item.bin + '"]')!.getBoundingClientRect();
        const from = el.getBoundingClientRect();
        const dx = target.left + target.width / 2 - from.left - from.width / 2;
        const dy = target.top + target.height * .3 - from.top - from.height / 2;
        const hand = dropOrigin.current;
        frames = [{ transform: hand ? `translate(${hand.left - from.left}px, ${hand.top - from.top}px)` : "none", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(.22)`, opacity: 0, offset: .55 },
          { opacity: 0 }];
      }
    }
    const animation = el.animate(frames, { duration, fill: "forwards", easing: outcome ? "ease-out" : "linear" });
    function finish() {
      if (clock.current?.animation !== animation || frozen.current) return;
      if (document.hidden) { pause(); return; }
      if (!outcome) judge(null);
      else {
        clock.current = null;
        setIndex(index + 1);
        setOutcome(null);
      }
    }
    clock.current = { animation, duration, finish };
    animation.onfinish = finish;
    if (frozen.current) animation.pause();
    else if (document.hidden) pause();
    return () => {
      animation.onfinish = null;
      animation.cancel();
      if (clock.current?.animation === animation) clock.current = null;
    };
  }, [round, index, outcome]);

  useEffect(() => {
    if (done) title.current?.focus({ preventScroll: true });
    else if (round.length) boxes.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [done, round]);

  const feedback = outcome === "correct" ? "正解！ +" + comboPoints(stats.combo) + "点"
    : outcome === "wrong" ? "おっと、違う箱みたい！"
    : outcome === "timeout" ? "右端に到着！ 次の品物へ" : selected ? "選択中。入れる箱をタップ！" : "どの箱に入れる？";
  return <article className="sort-game" aria-label={game.title} data-active={Boolean(item)} data-paused={paused}>
    <header className="sort-head">
      <div className="sort-date"><Icon name="calendar" size={16} />12.13 <span>SUN</span></div>
      <h1><small>サンタのお手伝い！</small><span>プレゼント</span><span>仕分けゲーム</span></h1>
      <p>{game.intro}</p>
    </header>
    <div className="sort-body">
      {item && <>
        <Scoreboard stats={stats} />
        <div className="sort-progress">
          <strong>出題 <b>{index + 1}</b> / 15</strong>
          <progress value={index + 1} max="15" aria-label="現在の出題数" />
          <button type="button" className="sort-pause" onClick={paused ? resume : pause}>{paused ? "再開" : "一時停止"}</button>
        </div>
      </>}
      <div className="sort-stage" onDragStart={e => e.preventDefault()}>
        <img className="sort-scenery" draggable={false} src={publicPath("/images/christmas/sorting-workshop.svg")} alt="" />
        <div className="sort-cat sort-noct"><Character who="noct" mirrored /></div>
        <div className="sort-cat sort-lux"><Character who="lux" /></div>
        {item ? <>
          <span className="sort-label" aria-live="polite">{item.name}</span>
          <div className="sort-track">
            <button type="button" className="sort-piece" key={index} ref={piece}
              aria-label={item.name + "を選ぶ"} aria-pressed={selected} aria-disabled={paused || outcome !== null}
              onPointerDown={pickUp} onPointerMove={moveHeld} onPointerUp={place}
              onLostPointerCapture={e => { if (grip.current?.id === e.pointerId) releaseGrip(); }}
              onPointerCancel={releaseGrip}
              onClick={e => { if (e.detail === 0 && clock.current && !outcome && !frozen.current) setSelected(true); }}>
              <span><ItemArt id={item.id} /></span>
            </button>
          </div>
          <div className="sort-in-hand" ref={ghost} hidden aria-hidden="true"><ItemArt id={item.id} /></div>
        </> : <div className="sort-display">{done
          ? <div className="sort-rank" role="img" aria-label={grade + "ランク"}><small>RANK</small>{grade}</div> : <Parcel />}</div>}
        <div className="sort-belt" aria-hidden="true"><i /><span /></div>
        {paused && <div className="sort-pause-cover">一時停止中</div>}
      </div>
      {item ? <>
        <p className="sort-feedback" role="status">{paused ? "「再開」で続きから遊べるよ" : feedback}</p>
        <div className="sort-boxes" ref={boxes}>
          {bins.map(bin => <button key={bin.id} type="button" data-bin={bin.id}
            aria-disabled={paused || outcome !== null}
            onPointerUp={e => {
              if (e.pointerType === "touch" && e.isPrimary && containsPointer(e.currentTarget, e)) judge(bin.id);
            }}
            onClick={e => {
              if (!("pointerType" in e.nativeEvent) || e.nativeEvent.pointerType !== "touch") judge(bin.id);
            }}
            onKeyDown={e => { if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault(); }}
            className={"sort-box" + (outcome === "correct" && item.bin === bin.id ? " wrapping" : "")}>
            <span className="sort-bin-icon"><ItemArt id={bin.icon} /></span><strong>{bin.label}</strong>
            {outcome === "correct" && item.bin === bin.id && <span className="sort-wrapped" aria-hidden="true"><Parcel /></span>}
          </button>)}
        </div>
      </> : <div className="sort-welcome">
        {done && <>
          <h2 tabIndex={-1} ref={title}>{grade === "C" ? "もう一度挑戦！" : "ゲームクリア！"}</h2>
          <Scoreboard stats={stats} result />
        </>}
        <Dialogue correct={done ? stats.correct : undefined} />
        {!done && <p className="sort-tip">品物をつかんで箱に入れても遊べるよ。</p>}
        <button type="button" className="action green sort-start" onClick={start}>
          <Icon name={done ? "game" : "gift"} size={20} />
          {done ? "もう一度あそぶ" : ctx.preview ? "試遊する" : "あそぶ"}
        </button>
      </div>}
      <Link prefetch={false} className={done ? "sort-home action" : "sort-home backlink"} href={url(ctx)}>お部屋に戻る</Link>
    </div>
  </article>;
}

function containsPointer(element: Element, point: { clientX: number; clientY: number }) {
  const r = element.getBoundingClientRect();
  return point.clientX >= r.left && point.clientX <= r.right && point.clientY >= r.top && point.clientY <= r.bottom;
}
