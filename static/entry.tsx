import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { Site } from "@/components/Site";
import { tokyoDate } from "@/lib/season";
import { mount, publicPath } from "@/lib/public-path";
import { doorTone, type Context, type Day, type Game } from "@/lib/types";
import rawGames from "@/content/games.json";
import "@/app/style.css";

const games = rawGames as Game[];
function CalendarApp({ days }: { days: Day[] }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    window.addEventListener("refresh-season-date", refresh);
    return () => window.removeEventListener("refresh-season-date", refresh);
  }, []);
  const date = tokyoDate(now);
  const doors = days.map(d => {
    const game = d.kind === "game" ? games.find(g => g.id === d.gameId) : undefined;
    const releaseDate = game?.releaseDate ?? d.releaseDate!;
    return { day: d.day, tone: doorTone(d), gameId: game?.id, releaseDate, available: date >= releaseDate };
  });
  const ctx: Context = { now, date, doors, preview: false, dev: false };
  const route = location.pathname.slice(mount.length).replace(/\/index\.html$/, "").replace(/\/$/, "");
  const [, section = "home", id] = route.split("/");
  const day = section === "calendar" && id ? Number(id) : 0;
  const entry = doors.some(d => d.day === day && d.available) ? days.find(d => d.day === day) : undefined;
  return <Site ctx={ctx} section={section} day={day} entry={entry} game={games.find(g => g.href === route)} games={games}/>;
}
const container = document.getElementById("site")!;
fetch(publicPath("/catalog.json"), { cache: "no-cache" })
  .then(response => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json() as Promise<Day[]>;
  })
  .then(days => createRoot(container).render(<CalendarApp days={days}/>))
  .catch(() => { container.textContent = "読み込みに失敗しました。ページを再読み込みしてください。"; });
