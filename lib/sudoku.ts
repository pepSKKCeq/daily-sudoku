export type Board = number[][];

const solved: Board = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
];
const seedFor = (date: string) => [...date].reduce((n, c) => ((n << 5) - n + c.charCodeAt(0)) | 0, 0) >>> 0;
const random = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const shuffle = <T,>(items: T[], rand: () => number) => [...items].sort(() => rand() - .5);

export function puzzleForDate(date: string) {
  const rand = random(seedFor(date));
  const digitMap = shuffle([1,2,3,4,5,6,7,8,9], rand);
  const bands = shuffle([0,1,2], rand), stacks = shuffle([0,1,2], rand);
  const rows = bands.flatMap(b => shuffle([0,1,2], rand).map(r => b * 3 + r));
  const cols = stacks.flatMap(s => shuffle([0,1,2], rand).map(c => s * 3 + c));
  const solution = rows.map(r => cols.map(c => digitMap[solved[r][c] - 1]));
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i), rand);
  const puzzle = solution.map(row => [...row]);
  // 42 given clues keeps this first release comfortably easy-to-medium.
  positions.slice(0, 39).forEach(i => { puzzle[Math.floor(i / 9)][i % 9] = 0; });
  return { puzzle, solution };
}

export const todayUTC = () => new Date().toISOString().slice(0, 10);
export const sameBoard = (a: Board, b: Board) => a.every((row, r) => row.every((v, c) => v === b[r][c]));
export const cloneBoard = (board: Board) => board.map(row => [...row]);
