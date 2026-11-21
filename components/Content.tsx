import Link from "next/link";
import { useState } from "react";
import { Context, Day, Game, Line, asset, kindNames, url } from "@/lib/types";
import chars from "@/content/characters.json";
import { Character } from "./Character";
import { Icon } from "./Icon";
function Dialogue({ lines }: { lines: Line[] }) {
  return (
    <div className="dialogue">
      {lines.map((line, i) => (
        <div key={i} className="speech">
          <span className={"avatar " + line.who}>
            <Character who={line.who} />
          </span>
          <div>
            <b>{chars[line.who].name}</b>
            <p>{line.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Content({
  ctx,
  entry,
  games,
}: {
  ctx: Context;
  entry: Day;
  games: Game[];
}) {
  const [choice, choose] = useState<number | null>(null);
  const game =
    entry.kind === "game" ? games.find((g) => g.id === entry.gameId) : null;
  return (
    <article className="paper content-card">
      <div className="eyebrow">
        DECEMBER {String(entry.day).padStart(2, "0")}　/　
        {kindNames[entry.kind]}
      </div>
      <h1>{entry.title}</h1>
      {entry.kind === "wallpaper" && (
        <div className="wallpapers">
          {entry.images.map((img) => (
            <figure key={img.file}>
              <img src={asset(ctx, entry.day, img.file)} alt={img.alt} />
              <figcaption>{img.alt}</figcaption>
              <a
                className="action green"
                download={img.file}
                href={asset(ctx, entry.day, img.file)}
              >
                <Icon name="download" />
                画像を保存
              </a>
            </figure>
          ))}
        </div>
      )}
      {"image" in entry && (
        <>
          <img
            className="story-art"
            src={asset(ctx, entry.day, entry.image.file)}
            alt={entry.image.alt}
          />
          <p className="body-text">{entry.body}</p>
        </>
      )}
      {entry.kind === "quiz" && (
        <>
          <h2>{entry.question}</h2>
          <div className="choices">
            {entry.choices.map((v, i) => (
              <button
                key={i}
                onClick={() => choose(i)}
                aria-pressed={choice === i}
              >
                <span>{i + 1}</span>
                {v}
              </button>
            ))}
          </div>
          {choice !== null && (
            <div className="answer" role="status">
              <strong>
                {choice === entry.answer
                  ? "正解！"
                  : "不正解。正解は「" +
                    entry.choices[entry.answer] +
                    "」です。"}
              </strong>
              <p>{entry.explanation}</p>
              <Dialogue lines={entry.lines} />
              <button onClick={() => choose(null)}>もう一度答える</button>
            </div>
          )}
        </>
      )}
      {"lines" in entry && entry.kind !== "quiz" && (
        <Dialogue lines={entry.lines} />
      )}
      {game && (
        <>
          <p>{game.intro}</p>
          <Link
            prefetch={false}
            className="action green"
            href={url(ctx, game.href)}
          >
            ゲームの入口へ
          </Link>
        </>
      )}
      <Link prefetch={false} className="backlink" href={url(ctx, "/calendar")}>
        カレンダーにもどる
      </Link>
    </article>
  );
}
