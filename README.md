# Glyph

**Glyph** is a responsive browser mini-game arcade built with React and Vite. V2 ships nine games behind one shared progression system.

## V2 games

- **Word Grid** — Wordle-style 5-letter guessing with a real English guess dictionary.
- **Hangman** — categorized words, hints, six lives, and score tracking.
- **Minesweeper** — 9×9 beginner board, 10 mines, first-click safety, recursive clearing, right-click flags, and mobile flag mode.
- **Memory Match** — 4×4 pair matching with move and time tracking.
- **2048** — keyboard, swipe, and touch controls with score tracking and a 2048 win condition.
- **Snake** — keyboard, swipe, and touch controls; eat 12 targets to clear a run.
- **Connections** — four hidden word groups, four allowed mistakes, shuffle, and near-miss feedback.
- **Reaction Test** — five reaction rounds with false-start handling and average reaction time.
- **Pokémon Connections** — themed 16-word grouping puzzles built from Pokémon, evolutions, regions, legendary groups, and other franchise knowledge.

## Shared arcade features

- Local player profile
- XP and levels
- Win streak
- Per-game played / wins / best score
- Persistent local scoreboards with top runs and recent attempt history
- 13 achievements
- Daily featured game
- Responsive desktop/mobile UI
- Tactile press feedback and game-specific animations
- Smooth dashboard/game transitions
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
│   ├── Connections.jsx
│   ├── Game2048.jsx
│   ├── Hangman.jsx
│   ├── MemoryMatch.jsx
│   ├── Minesweeper.jsx
│   ├── ReactionTest.jsx
│   ├── Snake.jsx
│   └── WordGrid.jsx
├── lib/
│   └── profile.js
├── App.jsx
├── main.jsx
└── styles.css
```

## Future candidates

Sudoku, Scribble, Breakout, chess puzzles, 2048 variants, typing games, and multiplayer modes.

---

Progress is device-local for now. Accounts and cloud sync can be added later without changing the game-module architecture.
