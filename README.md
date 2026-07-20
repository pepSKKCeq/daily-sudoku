# Daily Sudoku

A small Next.js daily Sudoku app. It uses React for the game and plain CSS for the design—there is no CSS framework to learn.

## Project map

- `app/` is the Next.js entry point: the page, site metadata, and all styling.
- `components/` contains `SudokuGame.tsx`, the complete interactive game screen.
- `lib/` contains `sudoku.ts`, which creates the same valid daily puzzle for every visitor.

Everything else is either configuration (`package.json`, `tsconfig.json`, and `next.config.ts`) or generated locally (`node_modules/` and `.next/`).

## Run locally

1. Install Node.js 20.9 or newer.
2. In this folder run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The puzzle is derived from the UTC date in `lib/sudoku.ts`, so every visitor gets the same new puzzle after midnight UTC without a database or scheduled job.
