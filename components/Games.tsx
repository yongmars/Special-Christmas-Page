import { Link } from "@/lib/navigation";
import { useState } from "react";
import { asset, Context, Game, GameId, url } from "@/lib/types";
import { Heading } from "./Calendar";
import { Icon } from "./Icon";
import { Memory } from "./games/Memory";
import { Slide } from "./games/Slide";
import Trial from "./games/jigsaw/Trial";
const symbols = { memory: "card", slide: "grid", jigsaw: "puzzle" };
export function Games({ ctx, games }: { ctx: Context; games: Game[] }) {
  return (
    <section className="section" id="games">
      <Heading en="MINI GAMES" title="クリスマスの遊び場" icon="game" />
      <div className="game-cards">
        {games.map((g) => (
          <Link
            prefetch={false}
            className={"game-card " + g.id}
            href={url(ctx, g.href)}
            key={g.id}
          >
            <div className="game-art">
              <span className="stamp">
                <Icon name={symbols[g.id]} size={44} />
              </span>
              <small>12.{g.releaseDate.slice(-2)} SUN</small>
            </div>
            <div className="game-info">
              <h3>{g.title}</h3>
              <span>
                <Icon
                  name={ctx.date < g.releaseDate ? "lock" : "game"}
                  size={15}
                />
                {ctx.date < g.releaseDate
                  ? "12月" + Number(g.releaseDate.slice(-2)) + "日公開"
                  : ctx.preview || g.status === "ready"
                    ? "あそべます"
                    : "開発中"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function GameDetail({
  ctx,
  g,
  onClear,
}: {
  ctx: Context;
  g: Game;
  onClear: (id: GameId) => void;
}) {
  const [playing, play] = useState(false);
  const day = ctx.doors.find((d) => d.gameId === g.id)!.day;
  const image = (f: string) => asset(ctx, day, f);
  const active =
    ctx.date >= g.releaseDate && (ctx.preview || g.status === "ready");
  return (
    <article className="paper game-detail">
      <span className="eyebrow">
        MINI GAMES　 /　12.{g.releaseDate.slice(-2)}
      </span>
      <h1>{g.title}</h1>
      <p>{g.intro}</p>
      {active ? (
        playing ? (
          <>
            {g.id === "memory" && (
              <Memory
                faces={g.faces!.map((f) => ({
                  ...f,
                  file: f.file ? image(f.file) : "",
                }))}
                backFile={g.backFile ? image(g.backFile) : undefined}
                onWin={() => onClear(g.id)}
              />
            )}
            {g.id === "slide" && (
              <Slide image={image(g.image!)} onWin={() => onClear(g.id)} />
            )}
            {g.id === "jigsaw" && (
              <Trial image={image(g.image!)} illustrationTitle={g.illustrationTitle ?? g.title} onWin={() => onClear(g.id)} />
            )}
          </>
        ) : (
          <button className="action green" onClick={() => play(true)}>
            {ctx.preview ? "試遊する" : "あそぶ"}
          </button>
        )
      ) : (
        <div className="notice">
          <Icon name={ctx.date < g.releaseDate ? "lock" : "game"} />
          {ctx.date < g.releaseDate
            ? "12月" +
              Number(g.releaseDate.slice(-2)) +
              "日 0時（日本時間）に公開します。"
            : "開発中です。完成までお楽しみに。"}
        </div>
      )}
      <Link prefetch={false} className="backlink" href={url(ctx)}>
        お部屋にもどる
      </Link>
    </article>
  );
}
