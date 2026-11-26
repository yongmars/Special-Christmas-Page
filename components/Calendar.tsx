import { Link } from "@/lib/navigation";
import { Icon } from "./Icon";
import { Context, url } from "@/lib/types";
import { season } from "@/lib/season";

const doorOrnaments = ["tree", "snow", "gift", "bell", "star"];
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
      <div className="calendar-crest" aria-hidden="true">
        <span className="calendar-roof"><Icon name="star" size={13} /></span>
      </div>
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
        {ctx.doors.map(({ day, tone, available, releaseDate }) => {
          const open = available && opened.includes(day),
            isToday = today === day;
          const cls =
            "door tone-" + tone +
            (day === 25 ? " door-finale" : "") +
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
                {isToday ? "今日" : day === 25 ? "✦" : (
                  <Icon name={doorOrnaments[(day - 1 + Math.floor((day - 1) / 5)) % doorOrnaments.length]} size={13} />
                )}
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
