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
