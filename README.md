# Glyph

**Glyph** is a browser mini-game arcade built with React and Vite. V1 ships four complete games behind one shared progression system.

## V1 games

- **Word Grid** — Wordle-style 5-letter guessing with a real English guess dictionary.
- **Hangman** — categorized words, hints, six lives, and score tracking.
- **Minesweeper** — 9×9 beginner board, 10 mines, first-click safety, recursive clearing, right-click flags, and mobile flag mode.
- **Memory Match** — 4×4 pair matching with move and time tracking.

## Shared arcade features

- Local player profile
- XP and levels
- Win streak
- Per-game played / wins / best score
- Seven achievements
- Daily featured game
- Responsive desktop/mobile UI
- Local persistence through `localStorage`

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
├── data/
│   └── words.js
├── games/
│   ├── Hangman.jsx
│   ├── MemoryMatch.jsx
│   ├── Minesweeper.jsx
│   └── WordGrid.jsx
├── lib/
│   └── profile.js
├── App.jsx
├── main.jsx
└── styles.css
```

## V2 candidates

Sudoku, Snake, 2048, Connections-style word groups, chess puzzles, and multiplayer Scribble.

---

Progress is intentionally device-local in V1. Accounts and cloud sync can be added later without changing the game-module architecture.
