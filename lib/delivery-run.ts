import { stages, verifiedTown, type Level, type Town } from "./delivery-town.ts";

export type Visit = {
  node: number; used: Set<number>; delivered: number[]; facing: "right" | "left";
  result: "playing" | "won" | "wrong" | "revisited" | "stranded";
};
export type Checkpoint = {
  level: Level; seed: number; moves: number[]; hints: boolean;
  previous: Partial<Record<Level, number>>;
};

export function departure(town: Town): Visit {
  return { node: town.start, used: new Set(), delivered: [], facing: "right", result: "playing" };
}
export function move(town: Town, from: Visit, target: number): { visit: Visit; reason?: string } {
  const reject = (reason: string) => ({ visit: from, reason });
  if (from.result !== "playing") return reject("この配達は終了しました。");
  const edge = town.roads.findIndex(r => (r.a === from.node && r.b === target) || (r.b === from.node && r.a === target));
  if (edge < 0) return reject("道路で直接つながった隣の地点を選んでね。");
  if (town.roads[edge].blocked) return reject("雪山で通行止めだよ。別の道路を選んでね。");
  if (from.used.has(edge)) return reject("そこは一度通った道路だよ。別の道路を選んでね。");
  const { cols, order } = stages[town.level];
  const dx = target % cols - from.node % cols;
  const next: Visit = { ...from, node: target, used: new Set(from.used).add(edge),
    facing: dx === 0 ? from.facing : dx > 0 ? "right" : "left" };
  const house = town.houses.indexOf(target);
  if (house >= 0) {
    if (from.delivered.includes(target)) next.result = "revisited";
    else if (order[house] !== order[from.delivered.length]) next.result = "wrong";
    else next.delivered = [...from.delivered, target];
  }
  if (next.delivered.length === order.length) next.result = "won";
  else if (next.result === "playing" && !town.roads.some((r, index) =>
    !r.blocked && !next.used.has(index) && (r.a === target || r.b === target))) next.result = "stranded";
  return { visit: next };
}

export function replay(town: Town, moves: number[]) {
  let visit = departure(town);
  for (const node of moves) {
    const step = move(town, visit, node);
    if (step.reason) return null;
    visit = step.visit;
  }
  return visit;
}

const isSeed = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
export function readCheckpoint(raw: unknown): Checkpoint | undefined {
  if (!raw || typeof raw !== "object") return;
  const data = raw as Partial<Checkpoint>;
  const { level, seed, moves, hints } = data;
  if (!(level === "practice" || level === "normal" || level === "hard") || !isSeed(seed) ||
      !Array.isArray(moves) || moves.length > 31 || !moves.every(Number.isInteger) || typeof hints !== "boolean") return;
  const previous: Checkpoint["previous"] = {};
  for (const key of ["practice", "normal", "hard"] as const) {
    const old = data.previous?.[key];
    if (isSeed(old)) previous[key] = old;
  }
  previous[level] = seed;
  return { level, seed, moves, hints, previous };
}

export function restoreDelivery(save: Checkpoint) {
  const town = verifiedTown(save.level, save.seed);
  if (!town) return null;
  const visit = replay(town, save.moves);
  return visit ? { town, visit } : null;
}
