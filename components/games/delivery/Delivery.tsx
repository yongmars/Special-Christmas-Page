import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { useProgress } from "@/lib/progress";
import { url, type Context } from "@/lib/types";
import { candidate, newTown, stages, type Level, type Town } from "@/lib/delivery-town";
import { departure, move, replay, restoreDelivery, type Checkpoint, type Visit } from "@/lib/delivery-run";
import { Art, DeliveryBoard, Parcel, giftNames } from "./DeliveryBoard";
import "./delivery.css";

type Round = { town: Town; visit: Visit; save: Checkpoint };
const levels = ["practice", "normal", "hard"] as const;
const descriptions = {
  practice: "いつもの町で道の通り方を練習しよう。",
  normal: "ふたつの赤い屋根。どちらから届けよう？",
  hard: "枝道の先まで考えて、一度で届けきろう。",
};
const messages = {
  won: "配達完了！", wrong: "次のプレゼントと違う色の家に着いたよ。",
  revisited: "この家にはもう届けたよ。配達済みの家は通り抜けられないよ。",
  stranded: "行き止まりだ！ ここから通れる道路が残っていないよ。",
  playing: "",
};

export function Delivery({ ctx, onWin }: { ctx: Context; onWin: () => void }) {
  const progress = useProgress(ctx.preview);
  const unlocked = progress.state.clears.includes("delivery");
  const checkpoint = progress.state.deliveryV1;
  const [round, setRound] = useState<Round | null>(null);
  const [message, setMessage] = useState("");
  const [moving, setMoving] = useState(false), [spark, setSpark] = useState(false);
  const lock = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const saved = useMemo(() => !round && checkpoint && (checkpoint.level !== "hard" || unlocked)
    ? restoreDelivery(checkpoint) : null, [round, checkpoint, unlocked]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function quiet() {
    clearTimeout(timer.current); lock.current = false; setMoving(false); setSpark(false); setMessage("");
  }
  function commit(next: Round) {
    setRound(next); progress.saveDelivery(next.save);
  }
  function start(level: Level) {
    if (lock.current || (level === "hard" && !unlocked)) return;
    quiet();
    const seed = checkpoint?.previous[level];
    const town = newTown(level, seed === undefined ? undefined : candidate(level, seed));
    const save = { level, seed: town.seed, moves: [], hints: level === "practice", previous: { ...checkpoint?.previous, [level]: town.seed } };
    commit({ town, visit: departure(town), save });
    heading.current?.focus();
  }
  function select(node: number) {
    if (lock.current || !round || round.visit.result !== "playing") return;
    const { visit, reason } = move(round.town, round.visit, node);
    if (reason) { setMessage(reason); return; }
    lock.current = true; setMoving(true);
    const delivered = visit.delivered.length > round.visit.delivered.length;
    setSpark(delivered);
    setMessage(delivered ? giftNames[stages[round.town.level].order[visit.delivered.length-1]] + "を届けたよ！" : "");
    if (visit.result === "won" && round.town.level === "normal") onWin();
    commit({ ...round, visit, save: { ...round.save, moves: [...round.save.moves, node] } });
    timer.current = setTimeout(() => {
      lock.current = false; setMoving(false); setSpark(false);
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : delivered ? 490 : 215);
  }
  function rewind(restart: boolean) {
    if (lock.current || !round || (!restart && round.town.level === "hard")) return;
    quiet();
    const moves = restart ? [] : round.save.moves.slice(0,-1);
    commit({ ...round, visit: replay(round.town, moves)!, save: { ...round.save, moves } });
  }
  const level = round?.town.level;
  const stage = level && stages[level];
  const result = round?.visit.result;
  const home = <Link prefetch={false} className="dl-home" href={url(ctx)}>ゲームを終了してお部屋に戻る</Link>;
  return <article className={"paper dl-game" + (round ? " in-play" : "")}>
    <header className="dl-header"><div>
      <span className="dl-date">12月21日 <i/> ミニゲーム</span>
      <h1 ref={heading} tabIndex={-1}>プレゼント配達</h1>
      <p>{round ? "隣の地点をタップ。通った道には金色の跡が残るよ。" : "雪の町をソリで巡って、屋根のマークと同じプレゼントを順番に届けよう。"}</p>
    </div><div className="dl-hero-art" aria-hidden="true"><Art name="sleigh-right" fallback="ソリ"/></div></header>
    {!round && <section className="dl-menu"><h2>難易度を選ぶ</h2>
      {saved && checkpoint && saved.visit.result !== "won" && <button className="action green dl-resume" onClick={() => {
        quiet(); setRound({ ...saved, save: checkpoint }); heading.current?.focus();
      }}>続きから <small>{stages[checkpoint.level].label}　{saved.visit.delivered.length} / {saved.town.houses.length} 軒</small></button>}
      <div className="dl-stages">{levels.map((key,i) =>
        <button key={key} disabled={key === "hard" && !unlocked} onClick={() => start(key)} className={"dl-stage " + key}>
          <Art name={"house-" + (["plush","vehicle","sweet"][i])} fallback="家"/>
          <span><small>{stages[key].label}　·　{stages[key].order.length}軒</small><strong>{stages[key].title}</strong>
            <span>{key === "hard" && !unlocked ? "ふつうをクリアすると遊べるよ。" : descriptions[key]}</span></span>
          <b aria-hidden="true">›</b></button>)}</div>
      <p className="dl-rule">道路は一度だけ。交差点には別の道から何度でも戻れるよ。ふつうをクリアすると、お部屋の窓の外に明かりが灯るよ。</p>{home}
    </section>}
    {round && stage && level && result && <section className="dl-play">
      <div className="dl-manifest"><div><strong>{stage.label} <span>· {stage.title}</span></strong>
        <b aria-live="polite">{round.visit.delivered.length} / {stage.order.length} 軒</b></div>
        <ol aria-label="配達順">{stage.order.map((gift,i) => {
          const done = i < round.visit.delivered.length, next = i === round.visit.delivered.length;
          return <li key={i} className={done ? "done" : next ? "next" : ""} aria-label={`${i+1}番 ${giftNames[gift]} ${done ? "配達済み" : next ? "次の配達" : ""}`}>
            <Parcel gift={gift}/>{done && <b>✓</b>}
          </li>;
        })}</ol>
      </div>
      <DeliveryBoard town={round.town} visit={round.visit} hints={round.save.hints} moving={moving} justDelivered={spark} select={select} explain={setMessage}/>
      <div className={"dl-status " + result} role="status">
        {result === "playing" ? message || (round.save.moves.length ? "光っている隣の地点を選んでね。" : "ソリの隣で光っている地点を選んで出発！") : messages[result]}
        {result === "won" && <span>{level === "normal" ? "お部屋の窓の外に、家々の明かりが灯ったよ。" : "すべての家にプレゼントが届いたよ。"}</span>}
        {result === "wrong" && <span>今届けるのは{giftNames[stage.order[round.visit.delivered.length]]}だよ。</span>}
      </div>
      <div className="dl-controls">
        {level !== "hard" && <button disabled={moving || !round.save.moves.length || result === "won"} onClick={() => rewind(false)}>一手戻す</button>}
        <button disabled={moving} onClick={() => rewind(true)}>最初から</button>
        <button aria-pressed={round.save.hints} disabled={moving} onClick={() => commit({ ...round, save: { ...round.save, hints: !round.save.hints } })}>配達番号を表示 <b>{round.save.hints ? "ON" : "OFF"}</b></button>
        {level !== "practice" && <button disabled={moving} onClick={() => start(level)}>別の町で遊ぶ</button>}
      </div>
      <div className="dl-links"><button disabled={moving} onClick={() => { quiet(); setRound(null); heading.current?.focus(); }}>難易度を選び直す</button>{home}</div>
    </section>}
  </article>;
}
