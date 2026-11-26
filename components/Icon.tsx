const paths: Record<string, React.ReactNode> = {
  star: (
    <path d="m12 2 2.7 6.4 6.9.6-5.3 4.5 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8L2.4 9l6.9-.6z" />
  ),
  gift: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="1" />
      <path d="M3 7h18v4H3zM12 7v14m0-14Q3 8 6 3q3-3 6 4 4-7 6-4 3 5-6 4z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 2v6m10-6v6M4 11h16m-13 4h2m3 0h2m3 0h1" />
    </>
  ),
  game: (
    <>
      <path d="M7 7h10q3 0 4 5l1 5q0 4-3 2l-4-3H9l-4 3q-4 2-3-2l1-5q1-5 4-5zM7 10v5m-2-2.5h4m6-1h.5m2.5 2h.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3m-4 4v3" />
    </>
  ),
  check: <path d="m4 13 5 5L20 6" />,
  bell: <path d="M6 10a6 6 0 0 1 12 0v3l2 4H4l2-4v-3ZM10 20a2 2 0 0 0 4 0M12 2v2" />,
  home: (
    <>
      <path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-6h4v6" />
    </>
  ),
  snow: (
    <path d="M12 1v22M2.5 6.5l19 11m-19 0 19-11M9 3l3 3 3-3m-6 18 3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4m12-14-1 4 4 1" />
  ),
  light: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m8 14 1 5h6l1-5m-6 8h4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18m6-18v18M3 9h18M3 15h18" />
    </>
  ),
  card: (
    <>
      <path d="m5 6-3 1 4 14 8-2" />
      <rect x="8" y="2" width="12" height="16" rx="2" />
      <path d="m14 6 2 4-2 3-2-3z" />
    </>
  ),
  puzzle: (
    <path d="M3 5h6q-2-5 2-5t2 5h6v5q5-2 5 2t-5 2v6h-6q2-5-2-5t-2 5H3v-6q5 2 5-2t-5-2z" />
  ),
  download: <path d="M12 2v13m-5-5 5 5 5-5M4 15v6h16v-6" />,
  tree: <path d="m12 2 6 7h-3l5 6h-4l5 5H3l5-5H4l5-6H6zM12 20v3" />,
  book: (
    <>
      <path d="M12 6Q6 2 2 5v14q4-3 10 1 6-4 10-1V5q-4-3-10 1v14" />
    </>
  ),
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.star}
    </svg>
  );
}
