# Glyph

**Glyph** is a responsive browser mini-game arcade built with React and Vite. V3 ships nineteen games behind one shared progression system.

## V3 games

- **Word Grid** — Wordle-style 5-letter guessing with a real English guess dictionary.
- **Hangman** — 120-word solo bank across Easy/Medium/Hard, local 2-player secret-word mode, 4/6/8/10-life presets, three-tier clue systems, paid hints that cost lives, physical keyboard input, and responsive touch controls.
- **Minesweeper** — 9×9 beginner board, 10 mines, first-click safety, recursive clearing, right-click flags, and mobile flag mode.
- **Memory Match** — 4×4 pair matching with move and time tracking.
- **2048** — keyboard, swipe, and touch controls with score tracking and a 2048 win condition.
- **Snake** — keyboard, swipe, and touch controls; eat 12 targets to clear a run.
- **Connections** — four hidden word groups, four allowed mistakes, shuffle, and near-miss feedback.
- **Reaction Test** — five reaction rounds with false-start handling and average reaction time.
- **Pokémon Connections** — themed 16-word grouping puzzles built from Pokémon, evolutions, regions, legendary groups, and other franchise knowledge.
- **Statle** — six Pokémon, hidden-stat picks with full reveal after selection, Gen 1–9 + Mega filters, all 93 distinct Mega Evolutions including Legends: Z-A / Mega Dimension additions, PokéAPI sprites/artwork, and a 600+ BST target.
- **Connect ४** — Connect Four with Easy/Medium/Hard AI, alpha-beta minimax, immediate tactical blocking, and local 2-player.
- **PokéGuess** — National Dex guessing with Gen filters, autocomplete, higher/lower comparisons, types, size feedback, and progressive clues.
- **Guesswork** — clue-ladder guessing across tech, space, nature, world, objects, and games.
- **Type Rush** — timed typing with difficulty, 30/60/90-second modes, WPM, accuracy, combo, and score.
- **Checkmate** — curated chess tactics with difficulty filters, interactive board selection, hints, timer, and adjusted scoring.
- **Crosswire** — compact crossword-style word squares with Across/Down clues, keyboard navigation, hints, checking, and timer.
- **Sudoku** — verified unique-solution 9×9 puzzles with Easy/Medium/Hard, notes, hints, mistakes, and timing.
- **Silhouette** — Pokémon silhouette guessing with Gen filters and progressively unlocked clues.
- **Deadcenter** — aim trainer with three target-size/speed modes, accuracy, reaction time, misses, and score.

## Shared arcade features

- Local player profile
- XP and levels
- Win streak
- Per-game played / wins / best score
- Persistent local scoreboards with top runs and recent attempt history
- 95 achievements
- Daily featured game
- Responsive desktop/mobile UI
- Compact expandable mobile game tiles and collapsible achievements
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
│   ├── AimTrainer.jsx
│   ├── ChessPuzzle.jsx
│   ├── ConnectFour.jsx
│   ├── Connections.jsx
│   ├── Crossword.jsx
│   ├── Game2048.jsx
│   ├── Guesswork.jsx
│   ├── Hangman.jsx
│   ├── MemoryMatch.jsx
│   ├── Minesweeper.jsx
│   ├── PokemonConnections.jsx
│   ├── PokemonGuess.jsx
│   ├── PokemonSilhouette.jsx
│   ├── ReactionTest.jsx
│   ├── Snake.jsx
│   ├── Statle.jsx
│   ├── Sudoku.jsx
│   ├── TypingRush.jsx
│   └── WordGrid.jsx
├── lib/
│   ├── pokemon.js
│   └── profile.js
├── App.jsx
├── main.jsx
└── styles.css
```


## Android APK

Glyph can also run as a native Android app through Capacitor 8.

### GitHub Actions APK

The repository includes `.github/workflows/android-apk.yml`. Relevant pushes to `main` and manual workflow runs build an installable debug APK.

After a successful **Build Android APK** run:

1. Open the workflow run in the GitHub **Actions** tab.
2. Scroll to **Artifacts**.
3. Download **Glyph-Android-APK**.
4. Extract `Glyph-debug.apk`.
5. Copy it to an Android device and install it. Android may ask for permission to install apps from the browser/file manager used to open it.

The debug APK is intended for direct installation/testing. A Play Store release should use a signed release build / AAB with a private signing key.

### Build locally

First-time Android project creation:

```bash
npm install
npm run android:add
npm run android:open
```

After the Android project already exists:

```bash
npm run android:sync
npm run android:open
```

The Android web build uses relative Vite asset paths so it works inside the Capacitor WebView while the normal `npm run build` remains configured for GitHub Pages.

Android's hardware Back button returns from an active game to the Glyph dashboard before exiting the app.


## Future candidates

Breakout, Scribble, Reversi, chess-puzzle expansion packs, daily challenges, cloud sync, and multiplayer modes.

---

Progress is device-local for now. Accounts and cloud sync can be added later without changing the game-module architecture.
