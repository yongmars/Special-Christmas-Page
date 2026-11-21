// Each cell is 100 units wide. This profile is symmetric about its midpoint,
// so traversing it backwards with the opposite normal yields the same cut.
const profile = [
  [14, 0, 31, 1, 39, 0],
  [45, -1, 39, 7, 39, 11],
  [39, 25, 61, 25, 61, 11],
  [61, 7, 55, -1, 61, 0],
  [69, 1, 86, 0, 100, 0],
];

function edge(x, y, dx, dy, sign) {
  if (!sign) return `L ${x + dx * 100} ${y + dy * 100}`;
  return profile.map(curve => {
    const coords = [];
    for (let i = 0; i < curve.length; i += 2) {
      const along = curve[i], out = curve[i + 1] * sign;
      coords.push(x + dx * along + dy * out, y + dy * along - dx * out);
    }
    return "C " + coords.join(" ");
  }).join(" ");
}

export function createShapes(n) {
  const horizontal = (row, col) => (row + col * 3) % 3 === 1 ? -1 : (col % 2 ? -1 : 1);
  const vertical = (row, col) => (row + col) % 2 ? 1 : -1;
  return Array.from({ length: n * n }, (_, id) => {
    const row = Math.floor(id / n), col = id % n;
    const path = ["M 0 0",
      edge(0, 0, 1, 0, row ? -horizontal(row - 1, col) : 0),
      edge(100, 0, 0, 1, col < n - 1 ? vertical(row, col) : 0),
      edge(100, 100, -1, 0, row < n - 1 ? horizontal(row, col) : 0),
      edge(0, 100, 0, -1, col ? -vertical(row, col - 1) : 0), "Z",
    ].join(" ");
    return { id, row, col, path };
  });
}

export function shufflePieces(n) {
  const slots = Array.from({ length: n * n }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots.map((slot, id) => ({ id, slot, angle: Math.floor(Math.random() * 4) * 90, placed: false, board: null }));
}

export function target(shape, board, n) {
  const cell = board.width / n;
  return { x: board.x + (shape.col + 0.5) * cell, y: board.y + (shape.row + 0.5) * cell };
}

export function isMatch(point, destination, angle, cell) {
  return angle % 360 === 0 && Math.hypot(point.x - destination.x, point.y - destination.y) <= cell * 0.28;
}
