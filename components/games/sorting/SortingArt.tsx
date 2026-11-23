type Plush = "bear" | "rabbit" | "cat";
type ItemId = Plush | "car" | "train" | "plane" | "candy" | "cookie" | "chocolate";

function StuffedAnimal({ animal }: { animal: Plush }) {
  const fur = { bear: "#d89354", rabbit: "#fff2d9", cat: "#eda15c" }[animal];
  const paw = { bear: "#edb97d", rabbit: "#f5cebb", cat: "#ffd5a0" }[animal];
  const top = animal === "rabbit" ? 6 : 0;
  return (
    <g stroke="#664333" strokeWidth="2.1" fill={fur}>
      <ellipse cx="50" cy="71" rx="21" ry="20" />
      <ellipse cx="29" cy="67" rx="8.5" ry="14" transform="rotate(34 29 67)" />
      <ellipse cx="71" cy="67" rx="8.5" ry="14" transform="rotate(-34 71 67)" />
      <ellipse cx="50" cy="75" rx="11" ry="12" stroke="none" fill={paw} />
      {[32, 68].map(x => <g key={x}>
        <ellipse cx={x} cy="84" rx="12" ry="10" />
        <ellipse cx={x} cy="85" rx="7" ry="5.5" fill={paw} stroke="none" />
      </g>)}
      <path d="M37 59q13 8 27-1l-3 8q-12 5-24-1z" fill="#247b73" />
      <path d="m57 63 9 3-4 12-4-3-4 1z" fill="#428b79" />
      <path d="m57 71 6 2" stroke="#f8c66e" strokeWidth="2.6" />
      <g transform={`translate(0 ${top})`}>
        {animal === "bear" && <>
          <circle cx="30" cy="24" r="12" /><circle cx="70" cy="24" r="12" />
          <g fill={paw} stroke="none"><circle cx="30" cy="24" r="6.5" /><circle cx="70" cy="24" r="6.5" /></g>
        </>}
        {animal === "rabbit" && <>
          <path d="M34 31C26 18 23-3 31-4c7-1 15 16 16 33zM55 28C57 9 63-6 70-4c8 3 2 25-6 36z" />
          <path d="M38 25q-9-21-7-23m30 23q4-19 8-23" fill="none" stroke="#e6ad9e" strokeWidth="4" />
        </>}
        {animal === "cat" && <>
          <path d="M24 36 23 10q1-2 4-1l17 13m15 0L75 9q3-2 3 2l-2 26" />
          <path d="m28 17 2 14 9-6zm44 0-10 8 9 6z" stroke="none" fill="#eaae9d" />
        </>}
        <path d="M22 43c0-15 11-24 28-24s28 10 28 25c0 14-13 21-28 21S22 58 22 43Z" />
        {animal === "cat" && <path d="m40 22 4 7m7-8 1 7m9-6-3 7" fill="none" stroke="#b96b39" strokeWidth="3.4" />}
        <ellipse cx="50" cy="51" rx="13.5" ry="8.5" fill={animal === "rabbit" ? "#fff9e8" : "#ffe2ac"} stroke="none" />
        <g fill="#472f2b" stroke="none">
          <ellipse cx="38" cy="42" rx="2.8" ry="3.4" /><ellipse cx="62" cy="42" rx="2.8" ry="3.4" />
          <path d="M46 48q4-3 8 0-.1 3-4 4-4-1-4-4" />
        </g>
        <path d="M50 51v3m0 0q-3 3-5 0m5 0q3 3 5 0" fill="none" strokeWidth="1.5" />
        {animal === "cat" && <path d="m23 47 9 2m-8 4 8-1m36-2 9-2m-9 5 8 1" strokeWidth="1.8" />}
        <path d="m36 57 2 2m2 0 2 2" stroke="#b47e5e" strokeWidth="1.4" />
      </g>
    </g>
  );
}

function Wheel({ x, y, r }: { x: number; y: number; r: number }) {
  return <g>
    <circle cx={x} cy={y} r={r} fill="#37494a" stroke="#283a3a" strokeWidth="2.5" />
    <circle cx={x} cy={y} r={r * 0.53} fill="#eac279" stroke="#ae804b" strokeWidth="1.5" />
    <circle cx={x} cy={y} r={r * 0.19} fill="#fff1c7" stroke="none" />
  </g>;
}

const objects = {
  car: <g stroke="#623c33" strokeWidth="2.5">
    <path d="m13 53 9-4 12-20q3-5 10-5h18q7 0 11 6l11 18 6 4q4 3 4 11l-1 6q-2 5-8 5H15q-7 0-8-6V59q1-5 6-6Z" fill="#d95043" />
    <path d="m29 48 11-17h10v17Zm27-17h6q5 0 8 6l7 11H56Z" fill="#aad8d6" />
    <path d="m36 44 7-10m18 4 3-4" fill="none" stroke="#eff6df" strokeWidth="2.3" />
    <path d="M15 59h67" stroke="#f79a68" strokeWidth="3.2" />
    <path d="M52 50v17m-8-12h4" fill="none" stroke="#a64037" strokeWidth="2" />
    <rect x="6" y="66" width="87" height="6" rx="3" fill="#ebc790" />
    <path d="M84 53h5q3 0 3 8h-9z" fill="#ffe093" />
    <Wheel x={26} y={72} r={10} /><Wheel x={75} y={72} r={10} />
  </g>,
  train: <g stroke="#374c45" strokeWidth="2.5">
    <path d="M11 27h31v39H11z" fill="#d95d4b" />
    <path d="M8 24q0-5 5-5h24q5 0 7 5l1 4H8z" fill="#396b63" />
    <rect x="17" y="34" width="17" height="19" rx="2" fill="#accfc4" />
    <path d="M39 44h33q10 0 10 10v11H39z" fill="#398077" />
    <path d="M63 44V30h10v14m-12-15v-6h15v6Z" fill="#85624d" />
    <path d="M68 42v23M47 45v18" stroke="#e7c77d" strokeWidth="4" />
    <path d="M11 64h70l10 12H11z" fill="#dba459" />
    <path d="m78 68 3 5m3-3 2 3" stroke="#84543e" strokeWidth="1.8" />
    <Wheel x={22} y={75} r={9} /><Wheel x={47} y={75} r={10} /><Wheel x={70} y={75} r={9} />
    <path d="m23 75 24 2 24-3" stroke="#dec49a" strokeWidth="3" />
    <path d="M67 18q-6-2-5-6 1-3 5-2" fill="none" stroke="#a8bdb7" />
  </g>,
  plane: <g stroke="#425459" strokeWidth="2.3" transform="rotate(-17 50 51)">
    <path d="m42 48-9-30q1-3 6-2l23 31Z" fill="#87c6c5" />
    <path d="M13 48 8 30q0-3 5-2l15 17" fill="#d6604a" />
    <path d="m8 47 51-4q12-5 19-4 10 1 17 11 2 4-8 6l-54 4q-11 1-20-5l-8-5Z" fill="#f7e7bb" />
    <path d="m15 54 58-4 20-2" stroke="#db6c51" strokeWidth="3.4" />
    <path d="m36 57-12 22q0 4 6 3l38-28z" fill="#5fa6ac" />
    <path d="m34 72 21-13" fill="none" stroke="#a3d7d2" />
    <path d="m71 43 7-1 5 4-14 1Z" fill="#629ca7" strokeWidth="1.4" />
    <path d="m37 47 3-.2m5-.3 3-.2m5-.3 3-.2" stroke="#538795" strokeWidth="2.8" />
    <path d="m9 47 8-5 11 1-10 6z" fill="#d8755b" />
  </g>,
  candy: <g transform="rotate(-16 50 50)" stroke="#743e39" strokeWidth="2.3">
    <path d="m29 45-15-12-5 3 2 8-5 4 3 5-3 7 3 7 19-11zm42 0 17-12 4 3-2 8 5 4-3 6 3 6-4 7-18-11z" fill="#e56758" />
    <path d="m13 42 12 7-12 3m74-10-12 8 12 3" fill="none" stroke="#f9b48b" />
    <circle cx="50" cy="50" r="24" fill="#fff3ce" />
    <path d="M50 50q-2-16-14-19l9-4q13 8 5 23Zm0 0q12-13 11-21l8 6q1 12-19 15Zm0 0q18 0 22-8l2 9q-8 9-24-1Zm0 0q12 12 21 10l-7 9q-11-1-14-19Zm0 0q-1 16 6 23l-11 1q-8-8 5-24Zm0 0q-13 10-13 20l-8-7q2-12 21-13Z" fill="#d85749" stroke="none" />
    <path d="M34 43q2-6 9-9" fill="none" stroke="#fffbed" strokeWidth="3" />
  </g>,
  cookie: <g stroke="#784f38" strokeWidth="2.4" transform="rotate(10 50 50)">
    <path d="M48 13q8-3 16 3 11-1 16 9 10 5 9 16 6 7 1 17-1 10-11 16-5 10-16 10-7 7-17 2-11 2-17-7-11-3-12-14-8-6-5-16-4-10 4-17 3-9 12-12 7-8 20-7Z" fill="#cc884a" />
    <path d="M24 34q5-10 15-13 19-6 31 5m-51 21-1 6" fill="none" stroke="#f0b878" strokeWidth="3.5" />
    <g fill="#704637" strokeWidth="1.2"><path d="m33 39 4-7q5-2 7 4l-2 5zM54 33l2-7q3-2 8 2l-1 6zM60 51l5-8q4-1 8 6l-3 5zM34 65l1-8 7-2 4 5-4 6zM53 73l4-6 7 2 1 6z" /></g>
    <g fill="#a96739" stroke="none"><circle cx="28" cy="49" r="2" /><circle cx="49" cy="46" r="2.8" /><circle cx="49" cy="61" r="1.7" /><circle cx="74" cy="61" r="2.2" /><circle cx="28" cy="72" r="1.6" /></g>
  </g>,
  chocolate: <g transform="rotate(17 50 50)" stroke="#614034" strokeWidth="2.1">
    <rect x="25" y="9" width="49" height="80" rx="4" fill="#80523e" />
    {[14, 31].map(y => [30, 51].map(x => <g key={x + "-" + y}>
      <rect x={x} y={y} width="18" height="15" rx="2" fill="#9d6548" />
      <path d={`M${x+3} ${y+10}v-7h11`} fill="none" stroke="#c38b64" strokeWidth="1.6" />
    </g>))}
    <path d="m23 44 7 4 7-5 9 6 8-5 9 6 8-5 5 3v40q-27 7-53 0Z" fill="#dbb87c" />
    <path d="m24 52 10 2 10-3 9 5 11-2 12 2v32q-27 8-52 0Z" fill="#ab4541" />
    <path d="M25 84q24 6 50 0" fill="none" stroke="#e6bc71" />
    <ellipse cx="50" cy="70" rx="13" ry="9" fill="#f9dfa1" />
    <path d="m50 64 2 4 5 2-5 2-2 4-2-4-5-2 5-2z" fill="#926242" stroke="none" />
  </g>,
};

export function ItemArt({ id }: { id: ItemId }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none"
      strokeLinejoin="round" strokeLinecap="round">
      {id === "bear" || id === "rabbit" || id === "cat"
        ? <StuffedAnimal animal={id} /> : objects[id]}
    </svg>
  );
}
