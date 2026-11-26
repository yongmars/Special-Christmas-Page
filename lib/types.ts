import { mount, publicPath } from "./public-path";
export type Who = "noct" | "lux";
export type GameId = "memory" | "slide" | "jigsaw" | "sorting" | "delivery";
export type Kind =
  "wallpaper" | "story" | "illustration" | "chat" | "quiz" | "game" | "special";
export type Art = { file: string; alt: string };
export type Line = { who: Who; text: string };
type Base = { day: number; title: string; releaseDate?: string };
export type Day = Base &
  (
    | { kind: "wallpaper"; images: Art[] }
    | {
        kind: "story" | "illustration";
        series: Who | "gallery"; episode: number; paragraphs: string[]; image: Art;
      }
    | { kind: "special"; noteUrl: string }
    | { kind: "special"; comic: [Art, Art, Art]; epilogue: Art; message: string[]; greeting: string }
    | { kind: "special"; video: string; image: Art }
    | {
        kind: "special"; status: "pending";
        body: string;
        image: Art;
        lines: Line[];
      }
    | {
        kind: "quiz";
        id: string; who: Who; correct: string; incorrect: string;
        question: string;
        choices: string[];
        answer: number;
        explanation: string;
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
  decoration: { id: string; label: string; lines: Line[] };
  intro: string;
  image?: string;
  illustrationTitle?: string;
  faces?: Face[];
  backFile?: string;
};
export type Door = {
  day: number;
  tone: ReturnType<typeof doorTone>;
  available: boolean;
  releaseDate: string;
  gameId?: GameId;
};
export function doorTone(day: Day) {
  if (day.day === 1) return "first";
  if (day.day === 25) return "finale";
  if (day.kind === "story" && day.series === "lux") return "lux";
  if (day.kind === "story" && day.series === "noct") return "noct";
  if (day.kind === "game") return "game";
  if (day.kind === "quiz") return "quiz";
  if (day.kind === "illustration" || day.day === 20) return "illustration";
  return "special";
}
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
    : publicPath(mount && path !== "/" ? path + "/" : path);
}
export function asset(ctx: Context, day: number, file: string) {
  if (mount) return publicPath("/art/" + String(day).padStart(2, "0") + "/" + encodeURIComponent(file));
  return (
    "/art/" +
    day +
    "/" +
    encodeURIComponent(file) +
    (ctx.preview ? "?preview=" + ctx.date : "")
  );
}
