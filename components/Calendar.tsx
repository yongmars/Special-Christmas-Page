import { Link } from "@/lib/navigation";
import { Icon } from "./Icon";
import { Context, url } from "@/lib/types";
import { season } from "@/lib/season";
export function Heading({
  en,
  title,
  icon,
  children,
}: {
  en: string;
  title: string;
  icon: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <span className="heading-icon">
        <Icon name={icon} size={25} />
      </span>
      <div>
        <span className="eyebrow">{en}</span>
        <h2>{title}</h2>
      </div>
      <div className="heading-meta">{children}</div>
    </div>
  );
}
export function Calendar({ ctx, opened }: { ctx: Context; opened: number[] }) {
  const { today } = season(ctx.date);
  return (
    <section className="section" id="calendar">
      <Heading
        en="ADVENT CALENDAR"
        title="アドベントカレンダー"
        icon="calendar"
      >
        <b>
          {
            ctx.doors.filter((d) => d.available && opened.includes(d.day))
              .length
          }
        </b>{" "}
        / 25 開封
      </Heading>
      <div className="calendar-note">
        <span>12月1日から、毎日ひとつの扉が開きます。</span>
        <small>
          <Icon name="lock" size={14} />
          これから　
          <Icon name="check" size={15} />
          開封済み
        </small>
      </div>
      <div className="doors">
        {ctx.doors.map(({ day, available, releaseDate }) => {
          const open = available && opened.includes(day),
            isToday = today === day;
          const cls =
            "door tone" +
            ((day - 1) % 5) +
            (available ? " available" : "") +
            (open ? " opened" : "") +
            (isToday ? " today" : "");
          const label =
            "12月" +
            day +
            "日・" +
            (isToday ? "今日・" : "") +
            (open
              ? "開封済み"
              : available
                ? "開けられる"
                : Number(releaseDate.slice(-2)) + "日公開");
          const face = (
            <>
              <span className="door-mark" aria-hidden="true">
                {isToday ? "今日" : day === 25 ? "✦" : "✧"}
              </span>
              <strong>{String(day).padStart(2, "0")}</strong>
              <Icon
                name={open ? "check" : available ? "gift" : "lock"}
                size={14}
              />
            </>
          );
          return available ? (
            <Link
              prefetch={false}
              key={day}
              className={cls}
              href={url(ctx, "/calendar/" + day)}
              aria-label={label}
            >
              {face}
            </Link>
          ) : (
            <button key={day} className={cls} disabled aria-label={label}>
              {face}
            </button>
          );
        })}
      </div>
    </section>
  );
}
