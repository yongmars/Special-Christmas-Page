"use client";
import { Link } from "@/lib/navigation";
import { useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { nextMidnight, season } from "@/lib/season";
import { useProgress } from "@/lib/progress";
import { Context, Day, Game, url } from "@/lib/types";
import { Room } from "./Room";
import { Calendar } from "./Calendar";
import { Games, GameDetail } from "./Games";
import { Content } from "./Content";
import { Preview } from "./Preview";
import { Icon } from "./Icon";
function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Icon name="tree" size={24} />
      </span>
      <span>
        Noct <i>&</i> Lux
      </span>
    </span>
  );
}
function Home({ ctx, decorations }: { ctx: Context; decorations: string[] }) {
  const s = season(ctx.date);
  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span />
            CHRISTMAS 2026
            <span />
          </div>
          <h1>
            ノクトとルクスの
            <br />
            クリスマス<span className="year">2026</span>
          </h1>
          <div className="hero-rule">✦</div>
          <p>
            雪降る夜、ふたりのお部屋へようこそ。
            <br />
            毎日の贈りものを、一緒に開けよう。
          </p>
          <span className="hero-dates">
            <Icon name="calendar" size={15} /> 2026.12.01 <i>—</i> 12.25
          </span>
        </div>
        <Room decorations={decorations} />
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />
      </div>
      <div className="present-bar">
        <div className="countdown">
          <span className="date-stamp">
            <Icon name="snow" size={27} />
          </span>
          <div>
            <span className="eyebrow">CHRISTMAS COUNTDOWN</span>
            <div className="count">
              {s.ended ? (
                "クリスマスの思い出"
              ) : s.days === 0 ? (
                "メリークリスマス！"
              ) : (
                <>
                  クリスマスまで あと <b>{s.days}</b> 日
                </>
              )}
            </div>
          </div>
        </div>
        {s.today ? (
          <Link
            prefetch={false}
            className="action red"
            href={url(ctx, "/calendar/" + s.today)}
          >
            <Icon name="gift" />
            今日のプレゼントを開ける
          </Link>
        ) : s.ended ? (
          <Link
            prefetch={false}
            className="action red"
            href={url(ctx, "/calendar")}
          >
            <Icon name="gift" />
            すべてのプレゼントを見る
          </Link>
        ) : (
          <button className="action red" disabled>
            <Icon name="gift" />
            <span>
              今日のプレゼント<small>12月1日から</small>
            </span>
          </button>
        )}
      </div>
    </>
  );
}
export function Site({
  ctx,
  section,
  day,
  entry,
  game,
  games,
}: {
  ctx: Context;
  section: string;
  day: number;
  entry?: Day;
  game?: Game;
  games: Game[];
}) {
  const p = useProgress(ctx.preview),
    router = useRouter();
  useEffect(() => {
    if (entry) p.opened(entry.day);
  }, [entry?.day, ctx.preview, ctx.date]);
  useEffect(() => {
    if (ctx.preview) return;
    const refresh = () => router.refresh();
    const seen = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const restored = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    const timer = setTimeout(
      refresh,
      Math.max(100, nextMidnight(ctx.now) - ctx.now + 75),
    );
    document.addEventListener("visibilitychange", seen);
    window.addEventListener("pageshow", restored);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", seen);
      window.removeEventListener("pageshow", restored);
    };
  }, [ctx.preview, ctx.now, router]);
  const home = section === "home",
    calendar = section === "calendar";
  return (
    <>
      <header className="topbar">
        <div className="nav-wrap">
          <Link
            prefetch={false}
            href={url(ctx)}
            aria-label="ノクトとルクスのお部屋"
          >
            <Brand />
          </Link>
          <nav aria-label="メインメニュー">
            {[
              ["home", "/", "home", "お部屋"],
              ["calendar", "/calendar", "calendar", "カレンダー"],
              ["games", "/games", "game", "ミニゲーム"],
            ].map(([s, path, icon, label]) => (
              <Link
                prefetch={false}
                key={s}
                aria-current={section === s ? "page" : undefined}
                href={url(ctx, path)}
              >
                <Icon name={icon} size={17} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="wrap">
        {ctx.preview && (
          <Preview
            ctx={ctx}
            games={games}
            state={p.state}
            opened={p.opened}
            clear={p.clear}
            reset={p.reset}
          />
        )}
        {home && (
          <Home
            ctx={ctx}
            decorations={games
              .filter((g) => p.state.clears.includes(g.id))
              .map((g) => g.decoration.id)}
          />
        )}
        {(home || (calendar && !day)) && (
          <Calendar ctx={ctx} opened={p.state.opened} />
        )}
        {day > 0 &&
          (entry ? (
            <Content key={entry.day} ctx={ctx} entry={entry} games={games} />
          ) : (
            <section className="paper">
              <span className="heading-icon">
                <Icon name="lock" />
              </span>
              <h1>12月{day}日の扉</h1>
              <p>
                {ctx.doors[day - 1].releaseDate.replaceAll("-", "/")}{" "}
                0時（日本時間）に開きます。
              </p>
              <Link
                prefetch={false}
                className="backlink"
                href={url(ctx, "/calendar")}
              >
                カレンダーにもどる
              </Link>
            </section>
          ))}
        {(home || (section === "games" && !game)) && (
          <Games ctx={ctx} games={games} />
        )}
        {game && (
          <GameDetail key={game.id} ctx={ctx} g={game} onClear={p.clear} />
        )}
      </main>
      <footer>
        <Brand />
        <span>クリスマスのお部屋　2026</span>
        {ctx.dev && !ctx.preview && (
          <a href="/dev/preview?date=2026-12-25">開発プレビュー</a>
        )}
      </footer>
    </>
  );
}
