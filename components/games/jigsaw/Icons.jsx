const paths = {
  back: <path d="m14 5-7 7 7 7" />,
  reset: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7" /></>,
  bulb: <><path d="M9 17c0-3-4-4-4-9a7 7 0 0 1 14 0c0 5-4 6-4 9ZM9.5 20h5M11 23h2" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.3"/><path d="m4 17 5-5 3 3 4-6 5 7"/></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 3v18M3 12h18"/></>,
  puzzle: <path d="M4 4h6c-1-5 6-5 5 0h5v6c5-1 5 6 0 5v5h-6c1-5-6-5-5 0H4v-6c5 1 5-6 0-5Z"/>,
  snow: <><path d="M12 2v20M3.4 7l17.2 10M3.4 17 20.6 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1"/></>,
  star: <path fill="currentColor" stroke="none" d="m12 1 2.7 7.6 8.1 3.4-8.1 2.8L12 23l-3-8.2-8-2.8 8-3.4Z"/>,
};
export function Icon({ name, size = 20 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function TreeMark() {
  return <svg aria-hidden="true" width="36" height="38" viewBox="0 0 36 38">
    <path fill="#e8bd72" d="m18 0 1.3 3.5 3.7.2-2.9 2.4.9 3.5-3-2-3 2 .8-3.5L13 3.7l3.7-.2Z"/>
    <path fill="#eee3bf" d="m18 8-7.5 10H14L6 27h5l-6 6h26l-6-6h5l-8-9h3.5Z"/>
    <path fill="#c6a367" d="M16 33h4v4h-4z"/><g fill="#ba4741"><circle cx="15" cy="21" r="1.6"/><circle cx="21" cy="26" r="1.5"/><circle cx="13" cy="29" r="1.3"/></g>
  </svg>;
}
