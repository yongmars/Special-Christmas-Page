import { Link } from "@/lib/navigation";
import { useRef } from "react";
import { Context, Day, Game, Line, asset, kindNames, url } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import chars from "@/content/characters.json";
import { Character } from "./Character";
import { Icon } from "./Icon";
import { Finale } from "./Finale";
import { ChristmasEve } from "./ChristmasEve";
function Dialogue({ lines, mirrored = false }: { lines: Line[]; mirrored?: boolean }) {
  return (
    <div className="dialogue">
      {lines.map((line, i) => (
        <div key={i} className={"speech " + line.who}>
          <span className={"avatar " + line.who}>
            <Character who={line.who} mirrored={mirrored} />
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
function PictureBook({ ctx, entry }: { ctx: Context; entry: Extract<Day, { kind: "story" | "illustration" }> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const src = asset(ctx, entry.day, entry.image.file);
  const series = entry.series === "gallery"
    ? "クリスマスのひととき " + ["①", "②", "③", "④"][entry.episode - 1]
    : chars[entry.series].name + "のプレゼント探し 第" + entry.episode + "話";
  return (
    <div className={"picture-book " + entry.series}>
      <header><p>{series}</p><h1>{entry.title}</h1></header>
      <button className="book-zoom" aria-label={entry.title + "を拡大する"} onClick={() => dialog.current?.showModal()}>
        <img src={src} alt={entry.image.alt} />
        <span>拡大して見る</span>
      </button>
      <div className="body-text">{entry.paragraphs.map(line => <p key={line}>{line}</p>)}</div>
      <dialog className="book-dialog" ref={dialog} aria-label={entry.title + "の拡大表示"}>
        <button onClick={() => dialog.current?.close()}>閉じる</button>
        <div className="book-scroll"><img src={src} alt={entry.image.alt} /></div>
      </dialog>
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
  const progress = useProgress(ctx.preview);
  const choice = entry.kind === "quiz" ? progress.state.quizAnswers[entry.id]?.lastChoice ?? null : null;
  const book = entry.kind === "story" || entry.kind === "illustration";
  const game =
    entry.kind === "game" ? games.find((g) => g.id === entry.gameId) : null;
  return (
    <article className="paper content-card">
      <div className="eyebrow">
        DECEMBER {String(entry.day).padStart(2, "0")}　/　
        {kindNames[entry.kind]}
      </div>
      {book ? <PictureBook ctx={ctx} entry={entry} /> : !("video" in entry) && <h1>{entry.title}</h1>}
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
      {"video" in entry && <Finale ctx={ctx} entry={entry} />}
      {"comic" in entry && <ChristmasEve ctx={ctx} entry={entry} />}
      {entry.kind === "special" && !("video" in entry) && !("comic" in entry) && ("noteUrl" in entry ? (
        <><p>ノクトとルクスのクリスマス4コマをnoteでお届けします。</p>
          {entry.noteUrl ? <a className="action green" href={entry.noteUrl}>noteで4コマを読む</a> : <p>記事の公開をお楽しみに。</p>}</>
      ) : <p>準備中です。</p>)}
      {entry.kind === "quiz" && (
        <>
          <Dialogue lines={[{who: entry.who, text: entry.question}]} />
          <div className="choices" role="group" aria-label="答えを1つ選ぶ">
            {entry.choices.map((v, i) => (
              <button key={i} onClick={() => progress.answer(entry.id, i)} disabled={choice !== null}
                aria-pressed={choice === i} className={choice !== null && i === entry.answer ? "correct" : ""}>
                <span>{"ABC"[i]}</span>{v}
                {choice !== null && i === entry.answer && <b> ✓ 正解</b>}
                {choice === i && <small> あなたの回答</small>}
              </button>
            ))}
          </div>
          {choice !== null && (
            <div className={"answer " + (choice === entry.answer ? "success" : "")} role="status">
              <strong>{choice === entry.answer ? "正解！" : "おしい！"}</strong>
              <Dialogue mirrored lines={[{who: entry.who, text: choice === entry.answer ? entry.correct : entry.incorrect}]} />
              <h3>豆知識</h3><p>{entry.explanation}</p>
              <button onClick={() => progress.retryQuiz(entry.id)}>もう一度</button>
            </div>
          )}
        </>
      )}
      {entry.kind === "chat" && (
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
