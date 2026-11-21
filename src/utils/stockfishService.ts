import { Chess } from 'chess.js';

export interface EngineLine {
  multipv: number;
  depth: number;
  scoreCp?: number; // centipawns from current player perspective
  scoreMate?: number; // mate in N
  pvLan: string[];
  pvSan: string;
  bestMove?: { from: string; to: string };
  formattedScore: string;
}

export interface EngineEvaluation {
  evalScore: string; // "+0.3", "-1.2", "#3"
  centipawns: number; // normalized from White's perspective (+ is white advantage, - is black advantage)
  depth: number;
  maxDepth: number;
  lines: EngineLine[];
  bestMove?: { from: string; to: string };
  isThinking: boolean;
}

export type EngineCallback = (evalData: EngineEvaluation) => void;

class StockfishManager {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private isEvaluating: boolean = false;
  private currentFen: string = '';
  private depth: number = 20;
  private multiPv: number = 3;
  private showBestMoveArrow: boolean = true;
  private listeners: Set<EngineCallback> = new Set();
  private currentEvaluation: EngineEvaluation = {
    evalScore: '0.0',
    centipawns: 0,
    depth: 0,
    maxDepth: 20,
    lines: [],
    isThinking: false
  };

  constructor() {
    // Lazy initialize worker when requested
  }

  public init() {
    if (this.worker || typeof window === 'undefined') return;

    try {
      this.worker = new Worker('/stockfish/stockfish-19-lite-single.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (err) => {
        console.warn('Stockfish Worker error, trying asm fallback...', err);
        this.fallbackToAsm();
      };

      // Send initial UCI commands
      this.worker.postMessage('uci');
      this.worker.postMessage(`setoption name MultiPV value ${this.multiPv}`);
      this.worker.postMessage('isready');
    } catch (e) {
      console.warn('Failed to start Stockfish worker:', e);
      this.fallbackToAsm();
    }
  }

  private fallbackToAsm() {
    if (this.worker) {
      try { this.worker.terminate(); } catch (_) {}
    }
    try {
      this.worker = new Worker('/stockfish/stockfish-19-asm.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.postMessage('uci');
      this.worker.postMessage(`setoption name MultiPV value ${this.multiPv}`);
      this.worker.postMessage('isready');
    } catch (err) {
      console.error('All Stockfish worker fallbacks failed:', err);
    }
  }

  private handleMessage(e: MessageEvent) {
    const line: string = typeof e.data === 'string' ? e.data : '';
    if (!line) return;

    if (line === 'uciok') {
      this.isReady = true;
    } else if (line === 'readyok') {
      this.isReady = true;
    } else if (line.startsWith('info') && line.includes('pv')) {
      this.parseInfoLine(line);
    } else if (line.startsWith('bestmove')) {
      this.isEvaluating = false;
      this.currentEvaluation.isThinking = false;
      this.notify();
    }
  }

  private parseInfoLine(line: string) {
    // Format: info depth 12 seldepth 14 multipv 1 score cp 28 ... pv d2d4 g8f6 c2c4
    const depthMatch = line.match(/\bdepth (\d+)\b/);
    const multipvMatch = line.match(/\bmultipv (\d+)\b/);
    const scoreCpMatch = line.match(/\bscore cp (-?\d+)\b/);
    const scoreMateMatch = line.match(/\bscore mate (-?\d+)\b/);
    const pvIndex = line.indexOf(' pv ');

    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

    let scoreCp: number | undefined;
    let scoreMate: number | undefined;
    let formattedScore = '0.0';

    // In UCI, score is from the perspective of the side to move!
    // We want to calculate the score normalized to White for the eval bar,
    // and display + / - according to White/Black advantage.
    const isWhiteToMove = !this.currentFen.includes(' b ');

    if (scoreCpMatch) {
      const rawCp = parseInt(scoreCpMatch[1], 10);
      scoreCp = rawCp;
      const whitePerspectiveCp = isWhiteToMove ? rawCp : -rawCp;
      const scoreInPawns = (whitePerspectiveCp / 100).toFixed(1);
      formattedScore = whitePerspectiveCp > 0 ? `+${scoreInPawns}` : scoreInPawns;
    } else if (scoreMateMatch) {
      const rawMate = parseInt(scoreMateMatch[1], 10);
      scoreMate = rawMate;
      const whitePerspectiveMate = isWhiteToMove ? rawMate : -rawMate;
      formattedScore = whitePerspectiveMate > 0 ? `+M${Math.abs(whitePerspectiveMate)}` : `-M${Math.abs(whitePerspectiveMate)}`;
    }

    if (pvIndex === -1) return;
    const pvPart = line.substring(pvIndex + 4).trim();
    const pvMoves = pvPart.split(/\s+/).filter(Boolean);

    // Format PV moves in SAN notation
    const pvSan = this.formatPvToSan(this.currentFen, pvMoves);

    let bestMove: { from: string; to: string } | undefined;
    if (pvMoves.length > 0 && pvMoves[0].length >= 4) {
      bestMove = {
        from: pvMoves[0].substring(0, 2),
        to: pvMoves[0].substring(2, 4)
      };
    }

    // Update lines array
    const lineIndex = multipv - 1;
    if (!this.currentEvaluation.lines[lineIndex] || depth >= this.currentEvaluation.lines[lineIndex].depth) {
      this.currentEvaluation.lines[lineIndex] = {
        multipv,
        depth,
        scoreCp,
        scoreMate,
        pvLan: pvMoves,
        pvSan,
        bestMove,
        formattedScore
      };
    }

    // If this is the primary line (multipv 1), update overall score
    if (multipv === 1) {
      this.currentEvaluation.depth = depth;
      this.currentEvaluation.evalScore = formattedScore;
      this.currentEvaluation.bestMove = bestMove;

      if (scoreCp !== undefined) {
        this.currentEvaluation.centipawns = isWhiteToMove ? scoreCp : -scoreCp;
      } else if (scoreMate !== undefined) {
        this.currentEvaluation.centipawns = (isWhiteToMove ? scoreMate : -scoreMate) > 0 ? 10000 : -10000;
      }
    }

    this.notify();
  }

  private formatPvToSan(startFen: string, movesLan: string[]): string {
    try {
      const chess = new Chess(startFen);
      const isBlackStart = startFen.includes(' b ');
      const startMoveNumber = parseInt(startFen.split(' ')[5] || '1', 10);
      const formattedParts: string[] = [];

      let currentMoveNum = startMoveNumber;
      let isWhite = !isBlackStart;

      for (let i = 0; i < Math.min(movesLan.length, 10); i++) {
        const lan = movesLan[i];
        if (lan.length < 4) break;
        const from = lan.substring(0, 2);
        const to = lan.substring(2, 4);
        const promotion = lan.length > 4 ? lan[4] : undefined;

        try {
          const m = chess.move({ from, to, promotion });
          if (!m) break;

          if (isWhite) {
            formattedParts.push(`${currentMoveNum}. ${m.san}`);
          } else {
            if (i === 0) {
              formattedParts.push(`${currentMoveNum}... ${m.san}`);
            } else {
              formattedParts.push(m.san);
            }
            currentMoveNum++;
          }
          isWhite = !isWhite;
        } catch (_) {
          break;
        }
      }

      return formattedParts.join(' ');
    } catch (_) {
      return movesLan.slice(0, 8).join(' ');
    }
  }

  public evaluate(fen: string) {
    this.init();
    this.currentFen = fen;
    this.currentEvaluation = {
      evalScore: '...',
      centipawns: 0,
      depth: 0,
      maxDepth: this.depth,
      lines: [],
      isThinking: true
    };
    this.notify();

    if (!this.worker) return;

    this.worker.postMessage('stop');
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${this.depth}`);
    this.isEvaluating = true;
  }

  public stop() {
    if (this.worker && this.isEvaluating) {
      this.worker.postMessage('stop');
      this.isEvaluating = false;
      this.currentEvaluation.isThinking = false;
      this.notify();
    }
  }

  public setDepth(depth: number) {
    this.depth = depth;
    if (this.currentFen) {
      this.evaluate(this.currentFen);
    }
  }

  public setMultiPv(lines: number) {
    this.multiPv = lines;
    if (this.worker) {
      this.worker.postMessage(`setoption name MultiPV value ${lines}`);
      if (this.currentFen) {
        this.evaluate(this.currentFen);
      }
    }
  }

  public setBestMoveArrow(val: boolean) {
    this.showBestMoveArrow = val;
    this.notify();
  }

  public getBestMoveArrow(): boolean {
    return this.showBestMoveArrow;
  }

  public getDepth(): number {
    return this.depth;
  }

  public getMultiPv(): number {
    return this.multiPv;
  }

  public subscribe(cb: EngineCallback): () => void {
    this.listeners.add(cb);
    cb(this.currentEvaluation);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentEvaluation);
    }
  }
}

export const engineService = new StockfishManager();
