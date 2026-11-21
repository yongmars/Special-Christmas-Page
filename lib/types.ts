export type Who = "noct" | "lux";
export type GameId = "memory" | "slide" | "jigsaw";
export type Kind =
  "wallpaper" | "story" | "illustration" | "chat" | "quiz" | "game" | "special";
export type Art = { file: string; alt: string };
export type Line = { who: Who; text: string };
type Base = { day: number; title: string; releaseDate?: string };
export type Day = Base &
  (
    | { kind: "wallpaper"; images: Art[] }
    | {
        kind: "story" | "illustration" | "special";
        body: string;
        image: Art;
        lines: Line[];
      }
    | {
        kind: "quiz";
        question: string;
        choices: string[];
        answer: number;
        explanation: string;
        lines: Line[];
      }
    | { kind: "chat"; lines: Line[] }
    | { kind: "game"; gameId: GameId }
  );
export type Face = { name: string; symbol: string; file: string };
export type Game = {
  id: GameId;
  title: string;
  releaseDate: string;
  href: string;
  status: string;
  decoration: { id: string; label: string };
  intro: string;
  image?: string;
  faces?: Face[];
  backFile?: string;
};
export type Door = {
  day: number;
  available: boolean;
  releaseDate: string;
  gameId?: GameId;
};
export type Context = {
  date: string;
  preview: boolean;
  doors: Door[];
  now: number;
  dev: boolean;
};
export const kindNames: Record<Kind, string> = {
  wallpaper: "壁紙プレゼント",
  story: "物語",
  illustration: "イラスト",
  special: "特別な贈りもの",
  quiz: "クイズ",
  chat: "小話",
  game: "ミニゲーム",
};
export function url(ctx: Pick<Context, "preview" | "date">, path = "/") {
  return ctx.preview
    ? "/dev/preview" + (path === "/" ? "" : path) + "?date=" + ctx.date
    : path;
}
export function asset(ctx: Context, day: number, file: string) {
  return (
    "/art/" +
    day +
    "/" +
    encodeURIComponent(file) +
    (ctx.preview ? "?preview=" + ctx.date : "")
  );
}
