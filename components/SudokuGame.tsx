'use client';

import { useEffect, useMemo, useState } from 'react';
import { Board, cloneBoard, puzzleForDate, sameBoard, todayUTC } from '@/lib/sudoku';

type Cell = [number, number];
type History = { board: Board; notes: Set<string> };
const key = (r: number, c: number) => `${r}-${c}`;
const emptyBoard = () => Array.from({ length: 9 }, () => Array(9).fill(0));
const secondsText = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function SudokuGame() {
  const date = useMemo(todayUTC, []);
  const { puzzle, solution } = useMemo(() => puzzleForDate(date), [date]);
  const [board, setBoard] = useState<Board>(puzzle);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [notes, setNotes] = useState<Set<string>>(new Set());
  const [noteMode, setNoteMode] = useState(false);
  const [past, setPast] = useState<History[]>([]), [future, setFuture] = useState<History[]>([]);
  const [seconds, setSeconds] = useState(0), [complete, setComplete] = useState(false), [checked, setChecked] = useState(false);
  const [stats, setStats] = useState({ streak: 0, best: 0, total: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(`sudoku-${date}`);
    if (saved) { const v = JSON.parse(saved); setBoard(v.board); setSeconds(v.seconds || 0); setComplete(v.complete || false); }
    const savedStats = localStorage.getItem('sudoku-stats'); if (savedStats) setStats(JSON.parse(savedStats));
  }, [date]);
  useEffect(() => { localStorage.setItem(`sudoku-${date}`, JSON.stringify({ board, seconds, complete })); }, [board, seconds, complete, date]);
  useEffect(() => {
    if (complete) return;
    const interval = setInterval(() => { if (!document.hidden) setSeconds(s => s + 1); }, 1000);
    return () => clearInterval(interval);
  }, [complete]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected) return;
      if (/^[1-9]$/.test(e.key)) place(Number(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete') erase();
      if (e.key === 'ArrowUp') move(-1, 0); if (e.key === 'ArrowDown') move(1, 0);
      if (e.key === 'ArrowLeft') move(0, -1); if (e.key === 'ArrowRight') move(0, 1);
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  const snapshot = () => { setPast(p => [...p.slice(-40), { board: cloneBoard(board), notes: new Set(notes) }]); setFuture([]); };
  const move = (dr: number, dc: number) => selected && setSelected([(selected[0] + dr + 9) % 9, (selected[1] + dc + 9) % 9]);
  const place = (n: number) => {
    if (!selected || puzzle[selected[0]][selected[1]] || complete) return;
    snapshot(); const [r, c] = selected;
    if (noteMode) { const updated = new Set(notes), k = key(r, c) + '-' + n; updated.has(k) ? updated.delete(k) : updated.add(k); setNotes(updated); return; }
    const next = cloneBoard(board); next[r][c] = n; setBoard(next); setNotes(old => new Set([...old].filter(item => !item.startsWith(key(r,c) + '-'))));
    if (sameBoard(next, solution)) finish();
  };
  const erase = () => { if (!selected || puzzle[selected[0]][selected[1]] || complete) return; snapshot(); const n = cloneBoard(board); n[selected[0]][selected[1]] = 0; setBoard(n); };
  const finish = () => { setComplete(true); const next = { streak: stats.streak + 1, best: stats.best ? Math.min(stats.best, seconds) : seconds, total: stats.total + 1 }; setStats(next); localStorage.setItem('sudoku-stats', JSON.stringify(next)); };
  const undo = () => { const last = past.at(-1); if (!last) return; setFuture(f => [{ board: cloneBoard(board), notes: new Set(notes) }, ...f]); setBoard(last.board); setNotes(last.notes); setPast(p => p.slice(0, -1)); };
  const redo = () => { const next = future[0]; if (!next) return; setPast(p => [...p, { board: cloneBoard(board), notes: new Set(notes) }]); setBoard(next.board); setNotes(next.notes); setFuture(f => f.slice(1)); };
  const reset = () => { setBoard(puzzle); setNotes(new Set()); setPast([]); setFuture([]); setSeconds(0); setComplete(false); setChecked(false); };
  const selectedValue = selected ? board[selected[0]][selected[1]] : 0;
  const count = (n: number) => board.flat().filter(v => v === n).length;
  const prettyDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(date + 'T12:00:00Z'));
  const share = async () => { const text = `Daily Sudoku · ${prettyDate}\n${complete ? `Solved in ${secondsText(seconds)} ✦` : 'In progress'}\n${window.location.origin}`; await navigator.clipboard.writeText(text); };

  return <div className="page-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">✦</span>daily sudoku</a><div className="top-actions"><button onClick={share} className="quiet-button">↗ Share</button><button className="avatar" aria-label="Profile">M</button></div></header>
    <section id="top" className="intro"><p className="eyebrow">YOUR DAILY MOMENT OF FOCUS</p><h1>Good morning,<br/><em>take your time.</em></h1><div className="puzzle-meta"><span>{prettyDate}</span><i /> <span>Daily Sudoku #{Math.floor((Date.parse(date + 'T00:00:00Z') - Date.UTC(2025,0,1)) / 86400000) + 1}</span><i /> <span>Easy · Medium</span></div></section>
    <section className="game-layout">
      <aside className="side-card timer-card"><p className="card-label">TODAY&apos;S TIME</p><div className="timer">{secondsText(seconds)}</div><div className="progress"><span style={{ width: `${Math.min(100, Math.round(board.flat().filter(Boolean).length / 81 * 100))}%` }} /></div><p className="muted">{board.flat().filter(Boolean).length} of 81 cells filled</p></aside>
      <div className="board-area">
        <div className={`sudoku-board ${complete ? 'celebrate' : ''}`} role="grid" aria-label="Daily Sudoku board">
          {board.map((row, r) => row.map((value, c) => { const clue = puzzle[r][c] !== 0; const isSelected = selected?.[0] === r && selected?.[1] === c; const related = selected && (selected[0] === r || selected[1] === c || (Math.floor(selected[0]/3) === Math.floor(r/3) && Math.floor(selected[1]/3) === Math.floor(c/3))); const incorrect = checked && value && value !== solution[r][c]; const candidate = Array.from({ length: 9 }, (_, x) => x + 1).filter(n => notes.has(key(r,c) + '-' + n)); return <button key={key(r,c)} role="gridcell" aria-label={`Row ${r+1}, column ${c+1}${value ? `, ${value}` : ', empty'}`} onClick={() => setSelected([r,c])} className={`cell ${clue ? 'clue' : ''} ${isSelected ? 'selected' : ''} ${related ? 'related' : ''} ${selectedValue && value === selectedValue ? 'matching' : ''} ${incorrect ? 'incorrect' : ''}`}>{value || (candidate.length ? <span className="notes">{candidate.map(n => <small key={n}>{n}</small>)}</span> : '')}</button>; }))}
        </div>
        <div className="number-pad" aria-label="Number pad">{[1,2,3,4,5,6,7,8,9].map(n => <button disabled={count(n) === 9} className={count(n) === 9 ? 'done' : ''} key={n} onClick={() => place(n)}>{n}</button>)}</div>
        <div className="tools"><button onClick={undo} disabled={!past.length}>↶ Undo</button><button onClick={redo} disabled={!future.length}>↷ Redo</button><button onClick={() => setNoteMode(!noteMode)} className={noteMode ? 'active' : ''}>✎ Notes</button><button onClick={erase}>⌫ Erase</button></div>
      </div>
      <aside className="side-card stats-card"><p className="card-label">YOUR RHYTHM</p><div className="stat"><b>{stats.streak}</b><span>day streak</span></div><div className="stat"><b>{stats.best ? secondsText(stats.best) : '—'}</b><span>best time</span></div><div className="stat"><b>{stats.total}</b><span>puzzles solved</span></div></aside>
    </section>
    <div className="footer-actions"><button onClick={reset}>Reset puzzle</button><button onClick={() => setChecked(true)} className="check-button">Check solution <span>→</span></button></div>
    {complete && <div className="success" role="status"><span>✦</span><div><b>Beautifully done.</b><p>You solved today&apos;s puzzle in {secondsText(seconds)}.</p></div></div>}
    <footer>Made for unhurried minds · A fresh puzzle arrives every day at midnight UTC</footer>
  </div>;
}
