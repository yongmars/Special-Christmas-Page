import { giftWrapping } from "@/lib/gift-wrapping";
import { publicPath } from "@/lib/public-path";
import type { BinId } from "@/lib/sorting";
import "./gift-parcel.css";

const marks = {
  paw: <><ellipse cx="4.6" cy="10" rx="2.5" ry="3.3" transform="rotate(-22 4.6 10)" />
    <ellipse cx="9.3" cy="6" rx="2.4" ry="3.3" /><ellipse cx="15" cy="6" rx="2.4" ry="3.3" />
    <ellipse cx="19.5" cy="10" rx="2.5" ry="3.3" transform="rotate(22 19.5 10)" />
    <path d="M4.8 17.8c0-2.3 2.5-4.3 4.1-6.4 1.8-2.4 4.5-2.4 6.2 0 1.7 2.1 4.1 4.1 4.1 6.4 0 2.8-2.6 3.9-5.1 3-1.5-.6-2.7-.6-4.2 0-2.5.9-5.1-.2-5.1-3Z" /></>,
  train: <><path fillRule="evenodd" d="M2 3h11v2h-1v5h4V7h-1V5h6v2h-1v4l2 2v3H2v-2h1V5H2Zm4 3v4h3V6Z" />
    <circle cx="6" cy="19" r="2.5" /><circle cx="12" cy="19" r="2.5" /><circle cx="18" cy="19" r="2.5" /></>,
  candy: <g transform="rotate(-25 12 12)"><path d="m1 6 5 3v6l-5 3 1.4-6Z M23 6l-5 3v6l5 3-1.4-6Z" />
    <path fillRule="evenodd" d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm.7 1.8c.4 3.6-1.1 7.2-4.9 8.7l1.5 1.4c4.2-2 5.7-6 5.2-9.5Z" /></g>,
};

export function WrappingMark({ category }: { category: BinId }) {
  const mark = giftWrapping[category].mark;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-mark={mark}>{marks[mark]}</svg>;
}

export function GiftParcel({ category }: { category: BinId }) {
  const wrap = giftWrapping[category];
  return <img className="gift-parcel" src={publicPath(wrap.image)} width={384} height={384}
    alt="" draggable={false} data-wrapping={category} data-mark={wrap.mark} />;
}
