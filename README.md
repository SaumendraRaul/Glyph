# Glyph

**Glyph** is a responsive browser mini-game arcade built with React and Vite. V2 ships ten games behind one shared progression system.

## V2 games

- **Word Grid** — Wordle-style 5-letter guessing with a real English guess dictionary.
- **Hangman** — 64 curated words across Easy/Medium/Hard, difficulty filtering, physical keyboard input, a one-use hint that costs a life, wrong-letter tracking, six-stage danger feedback, and score tracking.
- **Minesweeper** — 9×9 beginner board, 10 mines, first-click safety, recursive clearing, right-click flags, and mobile flag mode.
- **Memory Match** — 4×4 pair matching with move and time tracking.
- **2048** — keyboard, swipe, and touch controls with score tracking and a 2048 win condition.
- **Snake** — keyboard, swipe, and touch controls; eat 12 targets to clear a run.
- **Connections** — four hidden word groups, four allowed mistakes, shuffle, and near-miss feedback.
- **Reaction Test** — five reaction rounds with false-start handling and average reaction time.
- **Pokémon Connections** — themed 16-word grouping puzzles built from Pokémon, evolutions, regions, legendary groups, and other franchise knowledge.
- **Statle** — six Pokémon, hidden-stat picks with full reveal after selection, Gen 1–9 + Mega filters, all 93 distinct Mega Evolutions including Legends: Z-A / Mega Dimension additions, PokéAPI sprites/artwork, and a 600+ BST target.

## Shared arcade features

- Local player profile
- XP and levels
- Win streak
- Per-game played / wins / best score
- Persistent local scoreboards with top runs and recent attempt history
- 14 achievements
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
│   ├── Statle.jsx
│   └── WordGrid.jsx
├── lib/
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

Sudoku, Scribble, Breakout, chess puzzles, 2048 variants, typing games, and multiplayer modes.

---

Progress is device-local for now. Accounts and cloud sync can be added later without changing the game-module architecture.
