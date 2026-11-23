export const bins = [
  { id: "plush", label: "ぬいぐるみ", icon: "bear" },
  { id: "vehicle", label: "乗り物", icon: "train" },
  { id: "sweet", label: "お菓子", icon: "candy" },
] as const;

export type BinId = typeof bins[number]["id"];
const items = {
  plush: [["bear", "クマのぬいぐるみ"], ["rabbit", "ウサギのぬいぐるみ"], ["cat", "ネコのぬいぐるみ"]],
  vehicle: [["car", "自動車"], ["train", "電車"], ["plane", "飛行機"]],
  sweet: [["candy", "キャンディ"], ["cookie", "クッキー"], ["chocolate", "チョコレート"]],
} as const;

export type SortingItemId = (typeof items)[BinId][number][0];

function shuffled<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let end = copy.length - 1; end > 0; end--) {
    const pick = Math.floor(Math.random() * (end + 1));
    [copy[end], copy[pick]] = [copy[pick], copy[end]];
  }
  return copy;
}

export function makeSortingRound() {
  const groups = bins.map(({ id: bin }) => {
    const choices = items[bin].map(([id, name]) => ({ id, name, bin }));
    const first = shuffled(choices);
    // Keep the third and fourth items in each bin different, even when drawn back-to-back.
    const fourth = shuffled(choices.filter(item => item !== first[2]))[0];
    const fifth = shuffled(choices.filter(item => item !== fourth))[0];
    return [...first, fourth, fifth];
  });
  const order = shuffled(groups.flatMap((group, index) => group.map(() => index)));
  return order.map(index => groups[index].shift()!);
}

export const emptyScore = { correct: 0, misses: 0, score: 0, combo: 0, bestCombo: 0 };
export type SortingScore = typeof emptyScore;
export type Outcome = "correct" | "wrong" | "timeout";

export function crossingTime(index: number) {
  return index < 5 ? 6000 : index < 10 ? 5000 : 4000;
}

export function comboPoints(combo: number) {
  return 100 + Math.min(combo - 1, 4) * 20;
}

export function scoreItem(previous: SortingScore, outcome: Outcome): SortingScore {
  if (outcome !== "correct") return { ...previous, misses: previous.misses + 1, combo: 0 };
  const combo = previous.combo + 1;
  return {
    ...previous, combo, correct: previous.correct + 1,
    score: previous.score + comboPoints(combo),
    bestCombo: Math.max(previous.bestCombo, combo),
  };
}

export function rank(correct: number) {
  if (correct === 15) return "S";
  if (correct >= 13) return "A";
  return correct === 12 ? "B" : "C";
}
