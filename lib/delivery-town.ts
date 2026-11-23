export const stages = {
  practice: { label: "練習", title: "はじめての配達", cols: 3, rows: 3, order: ["plush", "vehicle", "sweet"] },
  normal: { label: "ふつう", title: "クリスマスの町へ", cols: 4, rows: 4, order: ["plush", "vehicle", "sweet", "plush", "vehicle"] },
  hard: { label: "むずかしい", title: "サンタの挑戦状", cols: 5, rows: 4, order: ["plush", "sweet", "vehicle", "plush", "vehicle", "sweet", "plush"] },
} as const;
export type Level = keyof typeof stages;
export type Gift = typeof stages[Level]["order"][number];
export type Road = { a: number; b: number; blocked: boolean };
export type Town = {
  level: Level; seed: number; start: number; roads: Road[]; houses: number[];
  deadEnds: number[]; solution: number[];
};

function shuffled<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// The seed describes the full town, including road closures. Keep the generator versioned with the save key.
export function candidate(level: Level, seed: number): Town {
  const { cols, rows, order } = stages[level];
  const start = (rows - 1) * cols;
  const nodes = Array.from({ length: cols * rows }, (_, i) => i);
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  let roads: Road[] = [];
  for (const a of nodes) {
    if (a % cols < cols - 1) roads.push({ a, b: a + 1, blocked: false });
    if (a + cols < nodes.length) roads.push({ a, b: a + cols, blocked: false });
  }
  let houses;
  if (level === "practice") {
    houses = [7, 3, 5];
    roads = roads.filter(r => !(r.a === 3 && r.b === 6));
    roads.find(r => r.a === 5 && r.b === 8)!.blocked = true;
  } else {
    houses = shuffled(nodes.filter(n => n !== start), random).slice(0, order.length);
    roads = shuffled(roads, random).slice(2);
    roads.slice(0, level === "hard" ? 3 : 2).forEach(r => { r.blocked = true; });
  }
  const degree = nodes.map(n => roads.filter(r => !r.blocked && (r.a === n || r.b === n)).length);
  const deadEnds = nodes.filter(n => degree[n] === 1 && n !== start && !houses.includes(n));
  return { level, seed, start, roads, houses, deadEnds, solution: [] };
}

// Independent trail search. Never expand an incorrect delivery or cross an edge twice.
export function solveTown(town: Town) {
  const { cols, rows, order } = stages[town.level];
  const neighbors = Array.from({ length: cols * rows }, () => [] as { node: number; edge: number }[]);
  town.roads.forEach(({ a, b, blocked }, edge) => {
    if (!blocked) {
      neighbors[a].push({ node: b, edge }); neighbors[b].push({ node: a, edge });
    }
  });
  const firstHouses = new Set<number>();
  const connected = new Set([town.start]);
  for (const node of connected) for (const link of neighbors[node]) connected.add(link.node);
  const path = [town.start], used = new Set<number>(), delivered = new Set<number>();
  let shortest: number[] = [], deadBranches = 0, explored = 0;
  function visit(node: number, first: number) {
    if (++explored > 12000) return;
    if (delivered.size === order.length) {
      firstHouses.add(first);
      if (!shortest.length || path.length < shortest.length) shortest = path.slice();
      return;
    }
    let exits = 0;
    for (const { node: next, edge } of neighbors[node]) {
      if (used.has(edge)) continue;
      const index = town.houses.indexOf(next);
      if (index >= 0 && (delivered.has(next) || order[index] !== order[delivered.size])) continue;
      exits++;
      used.add(edge); path.push(next);
      if (index >= 0) delivered.add(next);
      visit(next, first < 0 && index >= 0 ? next : first);
      delivered.delete(next); path.pop(); used.delete(edge);
    }
    if (exits === 0 && path.length >= 4) deadBranches++;
  }
  visit(town.start, -1);
  return { shortest, firstHouses, deadBranches, connected: connected.size === neighbors.length, exhausted: explored <= 12000 };
}

export function differentTown(a: Town, b?: Town) {
  const sameSet = (x: number[], y: number[]) => x.length === y.length && x.every(n => y.includes(n));
  return !b || (!sameSet(a.houses, b.houses) && !sameSet(a.deadEnds, b.deadEnds));
}

export function verifiedTown(level: Level, seed: number) {
  const town = candidate(level, seed);
  if (level !== "practice" && !town.deadEnds.length) return null;
  const { shortest, firstHouses, deadBranches, connected, exhausted } = solveTown(town);
  if (!connected || !exhausted || !shortest.length) return null;
  if (level === "normal" && (firstHouses.size !== 2 || shortest.length < 9 || shortest.length > 18)) return null;
  if (level === "hard" && (shortest.length < 15 || deadBranches < 10)) return null;
  town.solution = shortest;
  return town;
}

export const reserveSeeds = { normal: [52, 233, 772, 920, 1540], hard: [122, 154, 200, 217, 284] };

export function newTown(level: Level, previous?: Town, attempts = 160): Town {
  if (level === "practice") return verifiedTown(level, 0)!;
  const deadline = performance.now() + 40;
  for (let i = 0; i < attempts && performance.now() < deadline; i++) {
    const seed = Math.floor(Math.random() * 4294967296);
    const town = verifiedTown(level, seed);
    if (town && differentTown(town, previous)) return town;
  }
  // Reserves have pairwise distinct house sets and dead-end sets.
  for (const seed of shuffled([...reserveSeeds[level]], Math.random)) {
    const town = verifiedTown(level, seed);
    if (town && differentTown(town, previous)) return town;
  }
  throw new Error("配達できる町を用意できませんでした。");
}
