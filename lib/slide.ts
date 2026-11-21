export function neighbors(index: number, n: number) {
  const list: number[] = [],
    row = Math.floor(index / n),
    col = index % n;
  if (row > 0) list.push(index - n);
  if (row < n - 1) list.push(index + n);
  if (col > 0) list.push(index - 1);
  if (col < n - 1) list.push(index + 1);
  return list;
}
export function solved(board: number[]) {
  return board.every((v, i) => v === i);
}
export function shuffle(n: number) {
  const board = Array.from({ length: n * n }, (_, i) => i);
  let blank = board.length - 1,
    previous = -1;
  for (let k = 0; k < n * n * 2; k++) {
    const choices = neighbors(blank, n).filter((p) => p !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    [board[blank], board[next]] = [board[next], board[blank]];
    previous = blank;
    blank = next;
  }
  if (solved(board)) {
    const next = neighbors(blank, n)[0];
    [board[blank], board[next]] = [board[next], board[blank]];
  }
  return board;
}
