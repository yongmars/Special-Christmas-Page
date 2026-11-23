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
          <linearGradient id="pine"><stop stopColor="#254730"/><stop offset=".6" stopColor="#548153"/><stop offset="1" stopColor="#a4ad67"/></linearGradient>
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
        {has("wreath") && <g className="wreath" transform="translate(1318 217)"><title>暖炉の上のクリスマスリース</title>
          <path d="M0 -77V-89" stroke="#a68549" strokeWidth="4"/>
          <circle r="65" fill="none" stroke="#28492c" strokeWidth="25"/>
          {Array.from({length:32},(_,i)=><g key={i} transform={"rotate("+i*11.25+") translate(0 -65)"}>
            <path d="M-15 0Q-5 -18 18 -19Q11 -6 -15 0ZM-11 1Q7 -2 19 11Q0 13 -11 1Z" fill="url(#pine)" stroke="#395438"/>
            {i%4===0 && <><circle r="5" fill="#bc3c2c"/><circle cx="6" cy="-5" r="4" fill="#e65b39"/></>}
          </g>)}
          <path d="M0 -62Q-45 -94 -32 -52Q-18 -43 0 -62Q40 -90 33 -53Q20 -43 0 -62ZM-6 -60l-17 34 15 -6 8 -25 12 29 12 4 -15 -36Z" fill="#b63731" stroke="#77332d" strokeWidth="2"/>
          <circle cy="-62" r="8" fill="#e8b663"/>
        </g>}
        {has("presents") && <g className="new-present"><title>ツリーの下に並んだプレゼント</title>
          {[[642,683,1.35,"#963c37"],[711,699,1.1,"#dec89d"],[882,679,1.4,"#547755"],[955,700,1.05,"#b84839"],[657,725,.95,"#466956"],[751,721,1.3,"#af4742"],[837,734,1.05,"#e6c88f"],[913,735,.83,"#577d69"]].map(([x,y,k,color])=><use key={x} href="#parcel" transform={"translate("+x+" "+y+") scale("+k+")"} color={String(color)}/>)}
        </g>}
        {has("cake") && <g className="room-cake" transform="translate(130 687)"><title>テーブルのホールショートケーキ</title>
          <ellipse cy="25" rx="96" ry="17" fill="#b88c52" stroke="#e9ce99" strokeWidth="4"/>
          <path d="M-81 -6v24c1 19 160 19 162 0V-6" fill="#e4b37f" stroke="#955f41" strokeWidth="2"/>
          <path d="M-81 1Q0 26 81 1v8Q0 35 -81 9Z" fill="#fbebe0"/><ellipse cy="-7" rx="82" ry="19" fill="#fff5dd" stroke="#d0a880" strokeWidth="2"/>
          {[-58,-31,0,31,58].map((x,i)=><g transform={"translate("+x+" "+(i%2?-17:-9)+")"} key={x}><path d="M-12 -5Q-11 -23 0 -18Q14 -24 13 -5Q5 13 -1 12Q-10 7 -12 -5" fill="#ce4134" stroke="#a53529"/><path d="m0 -16 -9 -7 7 1 2 -6 2 6 8 -2 -6 7Z" fill="#507448"/><path d="m-6 -8 -1 3m10 -4 -1 3m-3 3 -1 3" stroke="#ffe18e" strokeWidth="2"/></g>)}
        </g>}
      </svg>
      <div className="cat noct"><Character who="noct" mirrored /></div>
      <div className="cat lux"><Character who="lux" /></div>
    </div>
  );
}
