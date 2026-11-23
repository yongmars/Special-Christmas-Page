import { useState, type CSSProperties } from "react";
import { publicPath } from "@/lib/public-path";
import { stages, type Gift, type Town } from "@/lib/delivery-town";
import type { Visit } from "@/lib/delivery-run";

export const giftNames = { plush: "赤・ぬいぐるみ", vehicle: "緑・乗り物", sweet: "黄・お菓子" };
const symbols = { plush: "赤🐾", vehicle: "緑🚂", sweet: "黄🍬" };
export function Art({ name, fallback, className = "" }: { name: string; fallback: string; className?: string }) {
  const [failed, fail] = useState("");
  return failed === name ? <span className={"dl-fallback " + className} aria-hidden="true">{fallback}</span> :
    <img className={className} alt="" draggable={false} src={publicPath("/images/christmas/delivery/" + name + ".webp")} onError={() => fail(name)} />;
}
export function Parcel({ gift }: { gift: Gift }) {
  return <Art name={gift} fallback={symbols[gift]} />;
}

export function DeliveryBoard({ town, visit, hints, moving, justDelivered, select, explain }: {
  town: Town; visit: Visit; hints: boolean; moving: boolean; justDelivered: boolean; select: (node: number) => void;
  explain: (reason: string) => void;
}) {
  const { cols, rows, order } = stages[town.level];
  const x = (n: number) => n % cols + 0.5, y = (n: number) => Math.floor(n / cols) + 0.5;
  const pos = (n: number) => ({ left: (100 * x(n) / cols) + "%", top: (100 * y(n) / rows) + "%" });
  const hintsOrder = town.solution.filter(n => town.houses.includes(n));
  const open = new Set<number>();
  town.roads.forEach((r, i) => {
    if (r.blocked || visit.used.has(i)) return;
    if (r.a === visit.node) open.add(r.b);
    if (r.b === visit.node) open.add(r.a);
  });
  return <div className={"dl-board" + (visit.result === "won" ? " dl-lit" : "")}
    style={{ "--cols": cols, "--rows": rows, aspectRatio: cols / (rows * 0.84) } as CSSProperties}
    role="group" aria-label="雪の町の配達地図" aria-busy={moving}>
    <svg className="dl-roads" viewBox={`0 0 ${cols * 100} ${rows * 100}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="dl-snow" width="37" height="31" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="7" r="1.5" fill="white"/><circle cx="24" cy="22" r=".9" fill="#85afaf"/>
        </pattern>
        <g id="dl-pines"><path d="m0 12 8-18 8 18h-4l4 7H0l4-7Z" fill="#7ca09a"/><path d="m2 8 6-14 5 12-5-3-3 6Z" fill="#f4fcf8"/></g>
      </defs>
      <rect width="100%" height="100%" fill="url(#dl-snow)"/>
      {Array.from({ length: (cols - 1) * (rows - 1) }, (_, i) => {
        const cx = (i % (cols-1) + 1) * 100, cy = (Math.floor(i / (cols-1)) + 1) * 100;
        return <g key={i} opacity=".65" transform={`translate(${cx-10} ${cy-4})`}><use href="#dl-pines"/><use href="#dl-pines" transform="translate(12 5) scale(.68)"/></g>;
      })}
      {town.roads.map(({ a, b, blocked }, i) => {
        const line = { x1: x(a)*100, x2: x(b)*100, y1: y(a)*100, y2: y(b)*100 };
        const used = visit.used.has(i);
        const restricted = blocked || used;
        return <g key={i} className={"dl-road" + (blocked ? " closed" : "") + (used ? " used" : "")}
          onClick={restricted && !moving && visit.result === "playing" ? () =>
            explain(blocked ? "雪山で通行止めだよ。別の道路を選んでね。" : "そこは一度通った道路だよ。別の道路を選んでね。") : undefined}>
          <line {...line} className="rim"/><line {...line} className="lane"/>
          {restricted && <line {...line} stroke="transparent" strokeWidth="25" />}
          {blocked && <g transform={`translate(${(x(a)+x(b))*50} ${(y(a)+y(b))*50})`}>
            <path d="M-19 9 Q-16 0 -12 1 Q-6 -17 2 -7 Q7 -10 13 0 Q18 0 20 9Z" fill="#f9ffff" stroke="#62858d" strokeWidth="2"/>
            <path d="m-10 5 6-4 5 3 7-3" fill="none" stroke="#99b6bc" strokeWidth="2"/>
          </g>}
        </g>;
      })}
    </svg>
    {Array.from({ length: cols*rows }, (_, node) => {
      const house = town.houses.indexOf(node), gift = order[house];
      const done = visit.delivered.includes(node), hint = hintsOrder.indexOf(node) + 1;
      const address = String.fromCharCode(65 + node % cols) + (Math.floor(node/cols)+1);
      const label = (house >= 0 ? giftNames[gift] + "の家" : node === town.start ? "出発点" : "交差点") + " " + address;
      return <button key={node} type="button" data-node={node} aria-label={label + (done ? " 配達済み" : "") + (house >= 0 && hints ? " 配達例" + hint + "番" : "")}
        aria-current={visit.node === node ? "location" : undefined}
        className={["dl-node",house >= 0 ? "house" : "junction",open.has(node) && visit.result === "playing" ? "reachable" : "",done ? "delivered" : ""].join(" ")}
        style={{ ...pos(node), "--delay": (hint-1)*100 + "ms" } as CSSProperties}
        onClick={() => select(node)}>
        {house >= 0 ? <><Art name={"house-" + gift} fallback={symbols[gift]}/><span className="dl-windows"/>
          {hints && <b className="dl-number">{hint}</b>}{done && <b className="dl-check">✓</b>}</> : <span className="dl-dot"/>}
      </button>;
    })}
    <div className={"dl-sleigh " + visit.facing} style={pos(visit.node)} aria-hidden="true">
      <Art name={"sleigh-" + visit.facing} fallback="ソリ"/>
      <span className="dl-cargo">{order.slice(visit.delivered.length).map((gift,i) =>
        <i key={i} style={{ "--stack-x": [0,35,68,17,51,32,44][i] + "%", "--stack-y": [0,0,0,40,40,76,105][i] + "%" } as CSSProperties}><Parcel gift={gift}/></i>)}</span>
      {justDelivered && <span key={visit.used.size} className="dl-flight"><Parcel gift={order[visit.delivered.length-1]}/><b>✦</b></span>}
    </div>
  </div>;
}
