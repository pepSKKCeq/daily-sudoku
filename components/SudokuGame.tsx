'use client';

import { useEffect, useMemo, useState } from 'react';
import { Board, cloneBoard, puzzleForDate, sameBoard, todayUTC } from '@/lib/sudoku';

type Cell = [number, number];
type Stats = { streak: number; best: number; total: number };

const secondsText = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function SudokuGame() {
  const date = useMemo(todayUTC, []);
  const { puzzle, solution } = useMemo(() => puzzleForDate(date), [date]);
  const [board, setBoard] = useState<Board>(puzzle);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [past, setPast] = useState<Board[]>([]);
  const [future, setFuture] = useState<Board[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [complete, setComplete] = useState(false);
  const [checked, setChecked] = useState(false);
  const [stats, setStats] = useState<Stats>({ streak: 0, best: 0, total: 0 });

  useEffect(() => {
    const savedGame = localStorage.getItem(`sudoku-${date}`);
    if (savedGame) {
      const game = JSON.parse(savedGame);
      setBoard(game.board);
      setSeconds(game.seconds || 0);
      setComplete(game.complete || false);
    }

    const savedStats = localStorage.getItem('sudoku-stats');
    if (savedStats) setStats(JSON.parse(savedStats));
  }, [date]);

  useEffect(() => {
    localStorage.setItem(`sudoku-${date}`, JSON.stringify({ board, seconds, complete }));
  }, [board, seconds, complete, date]);

  useEffect(() => {
    if (complete) return;
    const timer = setInterval(() => {
      if (!document.hidden) setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [complete]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (!selected) return;
      if (/^[1-9]$/.test(event.key)) place(Number(event.key));
      if (event.key === 'Backspace' || event.key === 'Delete') erase();
      if (event.key === 'ArrowUp') move(-1, 0);
      if (event.key === 'ArrowDown') move(1, 0);
      if (event.key === 'ArrowLeft') move(0, -1);
      if (event.key === 'ArrowRight') move(0, 1);
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });

  const saveBoardBeforeMove = () => {
    setPast((boards) => [...boards.slice(-40), cloneBoard(board)]);
    setFuture([]);
  };

  const move = (rowOffset: number, columnOffset: number) => {
    if (!selected) return;
    setSelected([
      (selected[0] + rowOffset + 9) % 9,
      (selected[1] + columnOffset + 9) % 9,
    ]);
  };

  const finish = () => {
    setComplete(true);
    const nextStats = {
      streak: stats.streak + 1,
      best: stats.best ? Math.min(stats.best, seconds) : seconds,
      total: stats.total + 1,
    };
    setStats(nextStats);
    localStorage.setItem('sudoku-stats', JSON.stringify(nextStats));
  };

  const place = (number: number) => {
    if (!selected || puzzle[selected[0]][selected[1]] || complete) return;

    saveBoardBeforeMove();
    const [row, column] = selected;
    const nextBoard = cloneBoard(board);
    nextBoard[row][column] = number;
    setBoard(nextBoard);

    if (sameBoard(nextBoard, solution)) finish();
  };

  const erase = () => {
    if (!selected || puzzle[selected[0]][selected[1]] || complete) return;

    saveBoardBeforeMove();
    const nextBoard = cloneBoard(board);
    nextBoard[selected[0]][selected[1]] = 0;
    setBoard(nextBoard);
  };

  const undo = () => {
    const previousBoard = past.at(-1);
    if (!previousBoard) return;
    setFuture((boards) => [cloneBoard(board), ...boards]);
    setBoard(previousBoard);
    setPast((boards) => boards.slice(0, -1));
  };

  const redo = () => {
    const nextBoard = future[0];
    if (!nextBoard) return;
    setPast((boards) => [...boards, cloneBoard(board)]);
    setBoard(nextBoard);
    setFuture((boards) => boards.slice(1));
  };

  const reset = () => {
    setBoard(puzzle);
    setPast([]);
    setFuture([]);
    setSeconds(0);
    setComplete(false);
    setChecked(false);
  };

  const selectedValue = selected ? board[selected[0]][selected[1]] : 0;
  const count = (number: number) => board.flat().filter((value) => value === number).length;
  const prettyDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));

  const share = async () => {
    const status = complete ? `Solved in ${secondsText(seconds)} ✦` : 'In progress';
    await navigator.clipboard.writeText(`Daily Sudoku · ${prettyDate}\n${status}\n${window.location.origin}`);
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">✦</span>daily sudoku</a>
        <div className="top-actions">
          <button onClick={share} className="quiet-button">↗ Share</button>
          <button className="avatar" aria-label="Profile">M</button>
        </div>
      </header>

      <section id="top" className="intro">
        <p className="eyebrow">YOUR DAILY MOMENT OF FOCUS</p>
        <h1>Good morning,<br /><em>take your time.</em></h1>
        <div className="puzzle-meta"><span>{prettyDate}</span></div>
      </section>

      <section className="game-layout">
        <aside className="side-card timer-card">
          <p className="card-label">TODAY&apos;S TIME</p>
          <div className="timer">{secondsText(seconds)}</div>
          <div className="progress"><span style={{ width: `${Math.min(100, Math.round(board.flat().filter(Boolean).length / 81 * 100))}%` }} /></div>
          <p className="muted">{board.flat().filter(Boolean).length} of 81 cells filled</p>
        </aside>

        <div className="board-area">
          <div className={`sudoku-board ${complete ? 'celebrate' : ''}`} role="grid" aria-label="Daily Sudoku board">
            {board.map((row, rowIndex) => row.map((value, columnIndex) => {
              const clue = puzzle[rowIndex][columnIndex] !== 0;
              const isSelected = selected?.[0] === rowIndex && selected?.[1] === columnIndex;
              const isRelated = selected && (
                selected[0] === rowIndex ||
                selected[1] === columnIndex ||
                (Math.floor(selected[0] / 3) === Math.floor(rowIndex / 3) && Math.floor(selected[1] / 3) === Math.floor(columnIndex / 3))
              );
              const isIncorrect = checked && value && value !== solution[rowIndex][columnIndex];
              const cellKey = `${rowIndex}-${columnIndex}`;

              return (
                <button
                  key={cellKey}
                  role="gridcell"
                  aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}${value ? `, ${value}` : ', empty'}`}
                  onClick={() => setSelected([rowIndex, columnIndex])}
                  className={`cell ${clue ? 'clue' : ''} ${isSelected ? 'selected' : ''} ${isRelated ? 'related' : ''} ${selectedValue && value === selectedValue ? 'matching' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                >
                  {value || ''}
                </button>
              );
            }))}
          </div>

          <div className="number-pad" aria-label="Number pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button key={number} disabled={count(number) === 9} className={count(number) === 9 ? 'done' : ''} onClick={() => place(number)}>{number}</button>
            ))}
          </div>

          <div className="tools">
            <button onClick={undo} disabled={!past.length}>↶ Undo</button>
            <button onClick={redo} disabled={!future.length}>↷ Redo</button>
            <button onClick={erase}>⌫ Erase</button>
          </div>
        </div>

        <aside className="side-card stats-card">
          <p className="card-label">YOUR RHYTHM</p>
          <div className="stat"><b>{stats.streak}</b><span>day streak</span></div>
          <div className="stat"><b>{stats.best ? secondsText(stats.best) : '—'}</b><span>best time</span></div>
          <div className="stat"><b>{stats.total}</b><span>puzzles solved</span></div>
        </aside>
      </section>

      <div className="footer-actions">
        <button onClick={reset}>Reset puzzle</button>
        <button onClick={() => setChecked(true)} className="check-button">Check solution <span>→</span></button>
      </div>

      {complete && (
        <div className="success" role="status">
          <span>✦</span>
          <div><b>Beautifully done.</b><p>You solved today&apos;s puzzle in {secondsText(seconds)}.</p></div>
        </div>
      )}

      <footer>Made for unhurried minds · A fresh puzzle arrives every day at midnight UTC</footer>
    </div>
  );
}
