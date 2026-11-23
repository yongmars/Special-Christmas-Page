import { Character } from "./Character";
import { publicPath } from "@/lib/public-path";

const villageWindows = [
  [[283,491],[296,491],[318,490],[332,490]],
  [[405,419],[430,419],[455,419],[405,437],[430,437],[455,437]],
];

export function Room({ decorations, arriving }: { decorations: string[]; arriving?: string }) {
  const has = (id: string) => decorations.includes(id);
  return (
    <div className="room-scene" role="group" aria-label="雪の窓と暖炉のあるクリスマスのお部屋">
      <img className="room-bg" src={publicPath("/images/christmas/living-room.webp")} alt="星を飾ったツリーと暖炉。窓の向こうに雪の街が見えます。" />
      <svg className="room-rewards" data-arriving={arriving} viewBox="0 0 1649 954" aria-label="ゲームで増えたお部屋の飾り" role="img">
        <defs>
          <radialGradient id="lamp"><stop stopColor="#fffbe0"/><stop offset=".23" stopColor="#fff1ac"/><stop offset=".5" stopColor="#ffc456" stopOpacity=".7"/><stop offset="1" stopColor="#ffb431" stopOpacity="0"/></radialGradient>
          <linearGradient id="ribbon"><stop stopColor="#ac773e"/><stop offset=".46" stopColor="#fff0b7"/><stop offset="1" stopColor="#d39c52"/></linearGradient>
          <g id="parcel" stroke="#63382b" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M0 1 40 -6 65 3 24 13Z" fill="currentColor"/><path d="M0 1 24 13 24 44 0 32Z" fill="currentColor"/><path d="M24 13 65 3 65 33 24 44Z" fill="currentColor"/>
            <path d="M0 1 24 13 24 44 0 32Z" fill="#37221c" opacity=".22"/>
            <path d="M8 6 15 9 15 39 8 36ZM43 8 50 6 50 37 43 39Z" fill="url(#ribbon)" stroke="none"/>
            <path d="m8 5 37 -9 7 2 -37 11zm35 3 -25 -11 7 -1 25 10z" fill="url(#ribbon)" stroke="none"/>
            <path d="M32 1Q3 -24 12 -21Q26 -25 32 1Q47 -24 52 -18Q55 -7 32 1Z" fill="url(#ribbon)"/>
          </g>
        </defs>
        {has("village-lights") && <g className="window-lights"><title>窓の外の家々に灯った明かり</title>
          {villageWindows.map((house, index) => (
            <g className="village-house" key={index}>
              {house.map(([x,y]) => (
                <g key={x+"-"+y}>
                  <circle cx={x} cy={y} r="13" fill="url(#lamp)" />
                  <rect x={x-2} y={y-3} width="4" height="6" rx="1" fill="#ffdd87" />
                </g>
              ))}
            </g>
          ))}
        </g>}
        {has("lights") && <g className="lights"><title>点灯したツリーのライト</title>
          {[[812,185],[843,201],[872,207],[781,244],[807,261],[844,272],[879,270],[911,258],[748,322],[782,345],[825,357],[873,356],[915,345],[959,327],[711,408],[747,431],[803,449],[854,455],[910,449],[964,432],[995,413],[666,512],[710,541],[771,563],[844,574],[913,569],[982,548],[1030,524],[644,601],[692,619],[752,633],[834,640],[907,637],[978,627],[1035,615]].map(([x,y]) =>
            <g key={x+"-"+y}><circle cx={x} cy={y} r="19" fill="url(#lamp)"/><circle cx={x} cy={y} r="3.4" fill="#fffacc"/></g>)}
        </g>}
        {has("wreath") && (
          <image
            className="wreath"
            href={publicPath("/images/christmas/wreath.webp")}
            x="1220" y="135" width="196" height="196"
          >
            <title>暖炉の上のクリスマスリース</title>
          </image>
        )}
        {has("presents") && <g className="new-present"><title>ツリーの下に並んだプレゼント</title>
          {[[642,683,1.35,"#963c37"],[711,699,1.1,"#dec89d"],[882,679,1.4,"#547755"],[955,700,1.05,"#b84839"],[657,725,.95,"#466956"],[751,721,1.3,"#af4742"],[837,734,1.05,"#e6c88f"],[913,735,.83,"#577d69"]].map(([x,y,k,color])=><use key={x} href="#parcel" transform={"translate("+x+" "+y+") scale("+k+")"} color={String(color)}/>)}
        </g>}
        {has("cake") && <g className="room-cake">
          <title>お部屋の右側の丸テーブルといちごのクリスマスケーキ</title>
          <defs>
            <filter id="cake-contact-shadow" x="-30%" y="-100%" width="160%" height="300%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <g fill="#482717" opacity=".42" filter="url(#cake-contact-shadow)" aria-hidden="true">
            <ellipse cx="1418" cy="878" rx="21" ry="5" />
            <ellipse cx="1597" cy="878" rx="21" ry="5" />
            <ellipse cx="1447" cy="845" rx="15" ry="4" />
            <ellipse cx="1568" cy="845" rx="15" ry="4" />
          </g>
          <image className="cake-table" href={publicPath("/images/christmas/cake-table.webp")} x="1372" y="624" width="274" height="274" />
        </g>}
      </svg>
      <div className="cat noct"><Character who="noct" mirrored /></div>
      <div className="cat lux"><Character who="lux" /></div>
    </div>
  );
}
