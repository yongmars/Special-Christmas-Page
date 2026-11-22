import { Character } from "./Character";
import { publicPath } from "@/lib/public-path";
import { Icon } from "./Icon";

export function Room({ decorations }: { decorations: string[] }) {
  return (
    <div
      className="room-scene"
      role="group"
      aria-label="雪の窓と暖炉のあるクリスマスのお部屋"
    >
      <img
        className="room-bg"
        src={publicPath("/images/christmas/room.svg")}
        alt="暖炉とクリスマスツリーのあるお部屋"
      />
      <div className="cat noct">
        <Character who="noct" />
      </div>
      <div className="cat lux">
        <Character who="lux" />
      </div>
      {decorations.includes("lights") && (
        <svg
          className="lights overlay"
          viewBox="0 0 760 440"
          role="img"
          aria-label="点灯したツリーのライト"
        >
          {[
            [438, 128],
            [477, 140],
            [420, 178],
            [501, 174],
            [474, 188],
            [418, 221],
            [496, 237],
            [451, 255],
            [527, 257],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="4" fill="#ffdf84" />
          ))}
        </svg>
      )}
      {decorations.includes("wreath") && (
        <span className="wreath" role="img" aria-label="クリスマスリース">
          🎀
        </span>
      )}
      {decorations.includes("presents") && (
        <span className="new-present" aria-label="ツリーの下のプレゼント">
          <Icon name="gift" size={32} />
        </span>
      )}
    </div>
  );
}
