import { useEffect, useRef, useState } from "react";
import { asset, type Art, type Context, type Day } from "@/lib/types";

type EveEntry = Extract<Day, { comic: Art[] }>;

export function ChristmasEve({ ctx, entry }: { ctx: Context; entry: EveEntry }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keepsake = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<Art | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const target = keepsake.current;
    if (!target || !("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(([item]) => {
      if (item.isIntersecting) {
        setRevealed(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function openPicture(picture: Art) {
    setSelected(picture);
    dialog.current?.showModal();
  }

  return (
    <div className="christmas-eve">
      <p className="eve-zoom-hint">絵をタップ・クリックすると拡大できます。</p>
      <ol className="eve-comic" aria-label="プレゼント交換の3コマ漫画">
        {entry.comic.map((panel, index) => (
          <li className="eve-panel" key={panel.file}>
            <button className="eve-art-button" aria-label={`第${index + 1}コマを拡大`} onClick={() => openPicture(panel)}>
              <img src={asset(ctx, entry.day, panel.file)} alt={panel.alt} />
              {index > 0 && <span className="eve-panel-sparkles" aria-hidden="true"><i /><i /><i /></span>}
            </button>
          </li>
        ))}
      </ol>
      <figure className="eve-keepsake" ref={keepsake} data-revealed={revealed}>
        <button className="eve-art-button" aria-label="最後のイラストを拡大" onClick={() => openPicture(entry.epilogue)}>
          <img src={asset(ctx, entry.day, entry.epilogue.file)} alt={entry.epilogue.alt} />
        </button>
        <div className="eve-keepsake-lights" aria-hidden="true"><i /><i /><i /><i /></div>
      </figure>
      <div className="eve-message">
        {entry.message.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <p className="eve-greeting" lang="en">{entry.greeting}</p>
      </div>
      <dialog className="book-dialog eve-dialog" ref={dialog} aria-label="イラストの拡大表示" onClose={() => setSelected(null)}>
        <button type="button" onClick={() => dialog.current?.close()}>閉じる</button>
        {selected && (
          <div className="book-scroll">
            <img src={asset(ctx, entry.day, selected.file)} alt={selected.alt} />
          </div>
        )}
      </dialog>
    </div>
  );
}
