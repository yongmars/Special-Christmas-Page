import { readFile } from "node:fs/promises";
import path from "node:path";
import rawGames from "@/content/games.json";
import { tokyoDate, validDate } from "./season";
import type { Context, Day, Game } from "./types";
export const games = rawGames as Game[];
export async function readDay(n: number): Promise<Day> {
  const data = await readFile(
    path.join(
      process.cwd(),
      "content",
      "days",
      String(n).padStart(2, "0") + ".json",
    ),
    "utf8",
  );
  return JSON.parse(data);
}
export function release(day: Day) {
  return day.kind === "game"
    ? games.find((g) => g.id === day.gameId)!.releaseDate
    : day.releaseDate!;
}
export async function context(
  preview: boolean,
  selected: unknown,
): Promise<Context> {
  const now = Date.now(),
    dev = process.env.NODE_ENV === "development";
  const date =
    dev && preview && validDate(selected) ? selected : tokyoDate(now);
  const all = await Promise.all(
    Array.from({ length: 25 }, (_, i) => readDay(i + 1)),
  );
  return {
    now,
    dev,
    date,
    preview: dev && preview,
    doors: all.map((d) => ({
      day: d.day,
      releaseDate: release(d),
      available: date >= release(d),
      gameId: d.kind === "game" ? d.gameId : undefined,
    })),
  };
}
export function artFiles(day: Day, preview: boolean): string[] {
  if (day.kind === "wallpaper") return day.images.map((i) => i.file);
  if ("image" in day) return [day.image.file];
  if (day.kind === "game") {
    const g = games.find((g) => g.id === day.gameId)!;
    if (preview || g.status === "ready")
      return [
        g.image,
        g.backFile,
        ...(g.faces || []).map((f) => f.file),
      ].filter((f): f is string => !!f);
  }
  return [];
}
