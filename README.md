# ChessAtlas Custom Opening Trainer (Clone)

A high-fidelity clone of **ChessAtlas's custom opening trainer**, built with React, Vite, TypeScript, and TailwindCSS. It runs 100% locally in the browser with **no backend or database required** — all repertoires, PGN trees, lines, and learning/training progress are persisted via `localStorage`.

---

## 🚀 Features

### 1. Repertoire Management & Tree PGN Extraction
- **New Repertoire Modal**:
  - Name input, White or Black repertoire selection.
  - Three import options: **Paste PGN**, **Built-in Presets**, and **Upload .pgn File**.
  - **Tree Variation Parser**: Automatically decomposes any complex PGN with deeply nested variations `( ... ( ... ) )`, sub-variations, move numbers, and comments `{ ... }` into unique, playable, legal opening lines.
  - Instant line counter preview before creating.
- **My Repertoire Dashboard**:
  - Matches the dark, sleek aesthetic of ChessAtlas with the cozy blue bird mascot.
  - Organized into **White** and **Black** sections with line counts, review indicators, and circular progress indicators.
  - Fast-action buttons to jump directly into **Learn** or **Train**.

### 2. Learn Mode
- **Orientation**: Board is straight for White repertoires and automatically flipped for Black repertoires.
- **Move Guidance**: Dynamic golden arrow indicates the expected move to make.
- **Automatic Opponent Moves**: When you make the repertoire move, the web app automatically plays the opponent's reply with a natural delay (~350ms) and authentic audio.
- **Mascot Speech Bubble**: Displays comments attached to that specific move/position in the PGN (e.g. key opening concepts, traps, or plans).
- **Move Navigation**:
  - First move (`<<`), Previous move (`<`), Next move (`>`), Last move (`>>`).
  - Full keyboard arrow support: **Left Arrow** (previous move) and **Right Arrow** (next move).
- **"All Lines" Modal**: Drawer/modal showing all lines in the repertoire with search and direct **Jump** buttons.
- **Linear Learning Progress**: When a line finishes, it celebrates with confetti, marks the line as learned, and advances smoothly to the next line.
- **Independent Progress Reset**: Ability to reset learning progress independently from training progress.

### 3. In-Browser Stockfish Engine (SF 19 NNUE)
- **Zero-Backend Engine**: Runs Stockfish 19 with NNUE locally inside the browser using WebAssembly / Web Workers.
- **Evaluation Bar**: Vertical animated evaluation bar on the left edge of the board. Smoothly slides in when Stockfish is toggled **ON**, and disappears when toggled **OFF**.
- **Multi-PV Analysis**: Displays top 1 to 5 engine lines with score in pawns (`+0.3`, `-1.2`) or mate (`#2`), depth badge (`d22`), and formatted SAN move sequences.
- **Engine Settings Modal**:
  - Analysis depth slider (10–30)
  - Number of lines slider (1–5)
  - Toggle best-move arrows on the board
  - Preview board size slider
  - Show/Hide engine variations button.

### 4. Train Mode
- **Spaced Randomized Line Rotation**: Lines are randomly rotated to test active recall without giving away the sequence.
- **Focused Training Interface**: Engine controls, move navigation buttons, and comments are hidden for distraction-free testing.
- **Mistake Handling**:
  - If you make a mistake, the board flashes red with a subtle shake animation and error sound.
  - The line **does NOT terminate immediately** — you can keep trying until you find the move!
  - An interactive **"Show Move"** button appears. Clicking it reveals the golden arrow for that position.
  - As soon as a mistake is made, the line is marked as untrained and kept in the rotation queue.
- **Line Mastery**: When a line is solved with zero mistakes, it is marked as **Trained** and removed from the active training rotation.
- **Independent Training Reset**: Option to reset training status and drill the repertoire from scratch.

### 5. Authentic Lichess Feel
- Crisp **cburnett** SVG chess piece set.
- Walnut wood square board theme (`#f0d9b5` / `#b58863`).
- Pure Web Audio API sound synthesizer: soft wooden move knock, crisp capture snap, castling double-tap, check alert, wrong move buzzer, and victory chimes.

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
The compiled static assets in `dist/` can be shipped or hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or opened directly as a static web app.
