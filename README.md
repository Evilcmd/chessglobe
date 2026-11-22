# ChessGlobe 🌍♟️

An interactive, modern chess opening trainer and repertoire builder with move-by-move master commentary, guided learning, spaced-repetition training, and local Stockfish engine analysis.

Runs 100% locally in the browser with **no backend or database required** — all repertoires, PGN variation trees, lines, and learning/training progress are persisted via `localStorage`.

---

## 🚀 Features

### 1. Repertoire Management & Deep PGN Tree Extraction
- **New Repertoire Modal**:
  - Name input, White or Black repertoire selection.
  - Three import options: **Paste PGN**, **Built-in Presets**, and **Upload .pgn File**.
  - **Tree Variation Parser**: Automatically decomposes any complex PGN with deeply nested variations `( ... ( ... ) )`, sub-variations, move numbers, and move annotations `{ ... }` into unique, playable, legal opening lines.
  - Instant line counter preview before creating.
- **My Repertoire Dashboard**:
  - Sleek, dark interface with circular progress indicators for both **Learning** and **Training**.
  - 10 collectible themed bird mascots automatically assigned round-robin across repertoires.
  - Non-destructive **Restore Defaults** to recover deleted preset repertoires without affecting existing openings or progress.
  - Fast-action buttons to jump directly into **Learn** or **Train**.

### 2. Learn Mode
- **Orientation**: Board is straight for White repertoires and automatically flipped for Black repertoires (with manual flip toggle available).
- **Move Guidance**: Dynamic golden arrow indicates the expected move to make.
- **Automatic Opponent Moves**: When you make the repertoire move, the web app automatically plays the opponent's reply with smooth animation and authentic chess sounds.
- **Mascot Speech Bubble**: Prominently displays explanations and master commentary attached to that specific move/position in the PGN.
- **Move Navigation**:
  - First move (`<<`), Previous move (`<`), Next move (`>`), Last move (`>>`).
  - Full keyboard arrow support: **Left Arrow** (previous move) and **Right Arrow** (next move).
- **"All Lines" Modal**: Drawer showing all lines in the repertoire with search and direct **Jump** buttons.
- **Celebration & Progress**: Confetti celebrations upon line completion with automatic advance to the next line in the repertoire.

### 3. In-Browser Stockfish Engine (SF 19 NNUE)
- **Zero-Backend Engine**: Runs Stockfish 19 with NNUE locally inside the browser using WebAssembly / Web Workers.
- **Evaluation Bar**: Vertical animated evaluation bar on the left edge of the board. Smoothly slides in when Stockfish is toggled **ON**, and disappears when toggled **OFF**.
- **Multi-PV Analysis**: Displays top 1 to 5 engine lines with score in pawns (`+0.3`, `-1.2`) or mate (`#2`), depth badge (`d22`), and formatted SAN move sequences.
- **Engine Settings Modal**:
  - Analysis depth slider (10–30)
  - Number of lines slider (1–5)
  - Toggle best-move arrows on the board
  - Preview board size slider

### 4. Spaced-Repetition Train Mode
- **Spaced Randomized Line Rotation**: Lines are shuffled to test active recall without giving away the sequence.
- **Focused Training Interface**: Engine controls, move navigation buttons, and comments are hidden for distraction-free testing.
- **Mistake Handling**:
  - If you make a mistake, the board flashes red with a subtle shake animation and error sound.
  - The line **does NOT terminate immediately** — you can keep trying until you find the move!
  - An interactive **"Show Move"** button appears. Clicking it reveals the golden arrow for that position and automatically disappears once the correct move is made.
- **Line Mastery**: When a line is solved with zero mistakes, it is marked as **Mastered** and removed from the active training rotation.

### 5. Authentic Chess Experience
- Crisp **cburnett** SVG chess piece set.
- Walnut wood square board theme (`#f0d9b5` / `#b58863`).
- Realistic sound effects: soft wooden move knock, capture snap, castling double-tap, check alert, wrong move buzzer, and victory chimes.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### Run in Development
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
npm run preview
```
The compiled static assets in `dist/` can be deployed directly to Vercel, Netlify, GitHub Pages, or any static web host.

---

## 📄 License
MIT
