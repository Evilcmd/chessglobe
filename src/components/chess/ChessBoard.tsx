import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPieces } from './pieces';
import { sound } from '../../utils/sound';

export interface ArrowData {
  from: string;
  to: string;
  color?: string; // hex or rgba
  opacity?: number;
}

interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  arrows?: ArrowData[];
  interactive?: boolean;
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  lastMove?: { from: string; to: string } | null;
  wrongSquare?: string | null;
  showEvalBar?: boolean;
  evalScore?: string;
  centipawns?: number;
  className?: string;
  showCapturedPieces?: boolean;
  topPlayerName?: string;
  bottomPlayerName?: string;
}

// Calculate captured pieces and material advantage from FEN
export interface CapturedState {
  wP: number;
  wN: number;
  wB: number;
  wR: number;
  wQ: number;
  bP: number;
  bN: number;
  bB: number;
  bR: number;
  bQ: number;
  whiteAdvantage: number;
  blackAdvantage: number;
}

export function calculateCapturedPieces(fen: string): CapturedState {
  const counts = {
    P: 0, N: 0, B: 0, R: 0, Q: 0,
    p: 0, n: 0, b: 0, r: 0, q: 0,
  };

  const placement = fen.split(' ')[0] || '';
  for (const ch of placement) {
    if (ch in counts) {
      counts[ch as keyof typeof counts]++;
    }
  }

  // White pieces captured by Black:
  const wP = Math.max(0, 8 - counts.P);
  const wN = Math.max(0, 2 - counts.N);
  const wB = Math.max(0, 2 - counts.B);
  const wR = Math.max(0, 2 - counts.R);
  const wQ = Math.max(0, 1 - counts.Q);

  // Black pieces captured by White:
  const bP = Math.max(0, 8 - counts.p);
  const bN = Math.max(0, 2 - counts.n);
  const bB = Math.max(0, 2 - counts.b);
  const bR = Math.max(0, 2 - counts.r);
  const bQ = Math.max(0, 1 - counts.q);

  const whiteMaterial = counts.P * 1 + counts.N * 3 + counts.B * 3 + counts.R * 5 + counts.Q * 9;
  const blackMaterial = counts.p * 1 + counts.n * 3 + counts.b * 3 + counts.r * 5 + counts.q * 9;

  return {
    wP, wN, wB, wR, wQ,
    bP, bN, bB, bR, bQ,
    whiteAdvantage: Math.max(0, whiteMaterial - blackMaterial),
    blackAdvantage: Math.max(0, blackMaterial - whiteMaterial),
  };
}

interface CapturedItem {
  pieceKey: string;
  count: number;
}

interface CapturedPiecesBarProps {
  name: string;
  color: 'w' | 'b';
  isTurn: boolean;
  capturedItems: CapturedItem[];
  materialDiff: number;
  width?: number | null;
  isTop: boolean;
}

const CapturedPiecesBar: React.FC<CapturedPiecesBarProps> = ({
  name,
  color,
  isTurn,
  capturedItems,
  materialDiff,
  width,
  isTop
}) => {
  return (
    <div
      style={{ width: width ? `${width}px` : '100%', maxWidth: '100%' }}
      className={`flex items-center justify-between px-2.5 py-1 bg-[#161c28]/90 border border-[#263043]/85 rounded-xl shadow-sm text-xs flex-shrink-0 transition-all duration-150 h-7 sm:h-8 select-none ${
        isTop ? 'mb-1.5' : 'mt-1.5'
      }`}
    >
      {/* Left: Player identity & turn dot */}
      <div className="flex items-center space-x-2 min-w-0">
        <div
          className={`w-3 h-3 rounded-full border shadow-xs flex-shrink-0 transition-all ${
            color === 'w'
              ? 'bg-slate-100 border-white ring-1 ring-slate-400/40'
              : 'bg-[#181d28] border-[#384358] ring-1 ring-black/60'
          } ${isTurn ? 'ring-2 ring-[#e5a93c] scale-110' : ''}`}
        />
        <span
          className={`text-xs font-semibold truncate tracking-tight transition-colors ${
            isTurn ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          {name}
        </span>
        {isTurn && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c] animate-pulse flex-shrink-0" title="To move" />
        )}
      </div>

      {/* Right: Captured pieces tray & material advantage */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          {capturedItems.map(item => {
            const PieceComponent = ChessPieces[item.pieceKey];
            if (!PieceComponent) return null;
            return (
              <div key={item.pieceKey} className="flex items-center -space-x-2">
                {Array.from({ length: item.count }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 drop-shadow-sm select-none"
                    title={`${item.count} captured`}
                  >
                    <PieceComponent className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {materialDiff > 0 && (
          <span className="text-[11px] font-bold font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded leading-none ml-1.5 shadow-xs">
            +{materialDiff}
          </span>
        )}
      </div>
    </div>
  );
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  orientation = 'white',
  arrows = [],
  interactive = true,
  onMove,
  lastMove,
  wrongSquare,
  showEvalBar = false,
  evalScore = '0.0',
  centipawns = 0,
  className = '',
  showCapturedPieces = true,
  topPlayerName = 'Opponent',
  bottomPlayerName = 'You'
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardContainerWidth, setBoardContainerWidth] = useState<number | null>(null);

  // Parse position with chess.js
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch (_) {
      return new Chess();
    }
  }, [fen]);

  const isFlipped = orientation === 'black';

  // Measure board container width to size top & bottom captured pieces bar exactly
  useEffect(() => {
    if (!boardContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setBoardContainerWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    observer.observe(boardContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const capturedState = useMemo(() => calculateCapturedPieces(fen), [fen]);

  const topColor: 'w' | 'b' = isFlipped ? 'w' : 'b';
  const bottomColor: 'w' | 'b' = isFlipped ? 'b' : 'w';

  // For Top player:
  const topCapturedItems: CapturedItem[] = useMemo(() => {
    return (topColor === 'b'
      ? [
          { pieceKey: 'wP', count: capturedState.wP },
          { pieceKey: 'wN', count: capturedState.wN },
          { pieceKey: 'wB', count: capturedState.wB },
          { pieceKey: 'wR', count: capturedState.wR },
          { pieceKey: 'wQ', count: capturedState.wQ },
        ]
      : [
          { pieceKey: 'bP', count: capturedState.bP },
          { pieceKey: 'bN', count: capturedState.bN },
          { pieceKey: 'bB', count: capturedState.bB },
          { pieceKey: 'bR', count: capturedState.bR },
          { pieceKey: 'bQ', count: capturedState.bQ },
        ]
    ).filter(i => i.count > 0);
  }, [topColor, capturedState]);

  const topAdvantage = topColor === 'b' ? capturedState.blackAdvantage : capturedState.whiteAdvantage;

  // For Bottom player:
  const bottomCapturedItems: CapturedItem[] = useMemo(() => {
    return (bottomColor === 'w'
      ? [
          { pieceKey: 'bP', count: capturedState.bP },
          { pieceKey: 'bN', count: capturedState.bN },
          { pieceKey: 'bB', count: capturedState.bB },
          { pieceKey: 'bR', count: capturedState.bR },
          { pieceKey: 'bQ', count: capturedState.bQ },
        ]
      : [
          { pieceKey: 'wP', count: capturedState.wP },
          { pieceKey: 'wN', count: capturedState.wN },
          { pieceKey: 'wB', count: capturedState.wB },
          { pieceKey: 'wR', count: capturedState.wR },
          { pieceKey: 'wQ', count: capturedState.wQ },
        ]
    ).filter(i => i.count > 0);
  }, [bottomColor, capturedState]);

  const bottomAdvantage = bottomColor === 'w' ? capturedState.whiteAdvantage : capturedState.blackAdvantage;

  // Files and ranks ordering based on orientation
  const displayFiles = useMemo(() => (isFlipped ? [...FILES].reverse() : FILES), [isFlipped]);
  const displayRanks = useMemo(() => (isFlipped ? [...RANKS].reverse() : RANKS), [isFlipped]);

  // Smooth piece sliding animation for moves
  const [animatingMove, setAnimatingMove] = useState<{ from: string; to: string; active: boolean } | null>(null);

  useEffect(() => {
    if (lastMove && lastMove.from && lastMove.to) {
      setAnimatingMove({ from: lastMove.from, to: lastMove.to, active: false });
      const frame = requestAnimationFrame(() => {
        setAnimatingMove({ from: lastMove.from, to: lastMove.to, active: true });
      });
      const timer = setTimeout(() => {
        setAnimatingMove(null);
      }, 270);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    } else {
      setAnimatingMove(null);
    }
  }, [lastMove?.from, lastMove?.to]);

  // Compute 2D board state
  const boardState = useMemo(() => {
    const map: Record<string, { type: string; color: 'w' | 'b' }> = {};
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = `${FILES[f]}${RANKS[r]}` as Square;
        const piece = chess.get(sq);
        if (piece) {
          map[sq] = { type: piece.type.toUpperCase(), color: piece.color };
        }
      }
    }
    return map;
  }, [chess]);

  // Legal moves from selected square (supports showing destinations even during opponent turn)
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !interactive) return [];
    try {
      const piece = boardState[selectedSquare];
      if (!piece) return [];

      // If it's this piece's turn, get real legal moves
      if (piece.color === chess.turn()) {
        const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
        return moves.map(m => ({ to: m.to, isCapture: Boolean(m.captured) }));
      }

      // If it's opponent's turn, simulate this piece's legal moves so destinations still show
      const tokens = fen.split(' ');
      if (tokens.length >= 2) {
        tokens[1] = piece.color;
        const simChess = new Chess(tokens.join(' '));
        const moves = simChess.moves({ square: selectedSquare as Square, verbose: true });
        return moves.map(m => ({ to: m.to, isCapture: Boolean(m.captured) }));
      }
      return [];
    } catch (_) {
      return [];
    }
  }, [chess, fen, selectedSquare, interactive, boardState]);

  // Preserve dragged piece and selection across FEN updates if the piece is still on that square
  const prevFenRef = useRef<string>(fen);
  useEffect(() => {
    if (prevFenRef.current !== fen) {
      prevFenRef.current = fen;

      // At start of line (no lastMove), clear selection & drag
      if (!lastMove) {
        setSelectedSquare(null);
        setDraggedSquare(null);
        setDragPos(null);
        return;
      }

      try {
        const newChess = new Chess(fen);

        // If currently dragging, keep holding the piece unless it was captured
        if (draggedSquare) {
          const piece = newChess.get(draggedSquare as Square);
          const originalColor = boardState[draggedSquare]?.color;
          if (!piece || (originalColor && piece.color !== originalColor)) {
            setDraggedSquare(null);
            setDragPos(null);
          }
        }

        // If a square is selected, keep it selected unless it was captured
        if (selectedSquare) {
          const piece = newChess.get(selectedSquare as Square);
          const originalColor = boardState[selectedSquare]?.color;
          if (!piece || (originalColor && piece.color !== originalColor)) {
            setSelectedSquare(null);
          }
        }
      } catch (_) {
        setSelectedSquare(null);
        setDraggedSquare(null);
        setDragPos(null);
      }
    }
  }, [fen, lastMove, draggedSquare, selectedSquare, boardState]);

  // Handle square click
  const handleSquareClick = (sq: string) => {
    if (!interactive) return;

    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      const piece = boardState[selectedSquare];
      const isPlayerTurn = piece && piece.color === chess.turn();

      // Only execute move if it's currently this piece's turn in chess.js
      if (isPlayerTurn && onMove) {
        const isLegal = legalMoves.some(m => m.to === sq);
        if (isLegal) {
          const from = selectedSquare;
          setSelectedSquare(null);
          onMove(from, sq);
          return;
        }
      }

      // If clicking another piece, switch selection directly
      const targetPiece = boardState[sq];
      if (targetPiece) {
        setSelectedSquare(sq);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    const piece = boardState[sq];
    if (piece) {
      // Allow selecting pieces anytime, even when opponent is playing
      setSelectedSquare(sq);
      return;
    }

    setSelectedSquare(null);
  };

  // Drag and drop handlers - allow picking up and dragging pieces anytime!
  const handleMouseDown = (e: React.MouseEvent, sq: string) => {
    if (!interactive) return;
    const piece = boardState[sq];
    if (!piece) return;

    setDraggedSquare(sq);
    setSelectedSquare(sq);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent, sq: string) => {
    if (!interactive) return;
    const piece = boardState[sq];
    if (!piece) return;

    const touch = e.touches[0];
    setDraggedSquare(sq);
    setSelectedSquare(sq);
    setDragPos({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    if (!draggedSquare) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setDragPos({ x: touch.clientX, y: touch.clientY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggedSquare || !boardRef.current) {
        setDraggedSquare(null);
        setDragPos(null);
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const squareSize = rect.width / 8;
        const colIdx = Math.floor((clientX - rect.left) / squareSize);
        const rowIdx = Math.floor((clientY - rect.top) / squareSize);

        if (colIdx >= 0 && colIdx < 8 && rowIdx >= 0 && rowIdx < 8) {
          const targetSq = `${displayFiles[colIdx]}${displayRanks[rowIdx]}`;
          const piece = boardState[draggedSquare];
          const isPlayerTurn = piece && piece.color === chess.turn();

          // Only submit move if it's this piece's turn
          if (targetSq !== draggedSquare && onMove && isPlayerTurn) {
            const isLegal = legalMoves.some(m => m.to === targetSq);
            if (isLegal) {
              onMove(draggedSquare, targetSq);
              setSelectedSquare(null);
            }
          }
        }
      }

      setDraggedSquare(null);
      setDragPos(null);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!draggedSquare || !boardRef.current) {
        setDraggedSquare(null);
        setDragPos(null);
        return;
      }

      const touch = e.changedTouches[0];
      const rect = boardRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const squareSize = rect.width / 8;
        const colIdx = Math.floor((touch.clientX - rect.left) / squareSize);
        const rowIdx = Math.floor((touch.clientY - rect.top) / squareSize);

        if (colIdx >= 0 && colIdx < 8 && rowIdx >= 0 && rowIdx < 8) {
          const targetSq = `${displayFiles[colIdx]}${displayRanks[rowIdx]}`;
          const piece = boardState[draggedSquare];
          const isPlayerTurn = piece && piece.color === chess.turn();

          // Only submit move if it's this piece's turn
          if (targetSq !== draggedSquare && onMove && isPlayerTurn) {
            const isLegal = legalMoves.some(m => m.to === targetSq);
            if (isLegal) {
              onMove(draggedSquare, targetSq);
              setSelectedSquare(null);
            }
          }
        }
      }

      setDraggedSquare(null);
      setDragPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggedSquare, displayFiles, displayRanks, legalMoves, onMove, boardState, chess]);

  // Convert chess square (e.g. 'e4') to 0-7 SVG coordinate percentages (0 to 100)
  const getSquareCenter = (sq: string): { x: number; y: number } | null => {
    if (sq.length < 2) return null;
    const file = sq[0];
    const rank = sq[1];
    const colIdx = displayFiles.indexOf(file);
    const rowIdx = displayRanks.indexOf(rank);
    if (colIdx === -1 || rowIdx === -1) return null;
    return {
      x: (colIdx + 0.5) * 12.5,
      y: (rowIdx + 0.5) * 12.5
    };
  };

  // Eval bar height percentage (standard sigmoid curve)
  const whiteAdvantagePercent = useMemo(() => {
    const cp = centipawns;
    const winChance = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
    let percent = 50 + winChance * 50;
    percent = Math.max(3, Math.min(97, percent));
    return percent;
  }, [centipawns]);

  const barTopFillPercent = isFlipped ? whiteAdvantagePercent : 100 - whiteAdvantagePercent;

  return (
    <div className={`flex flex-col items-center justify-center select-none h-full max-h-full ${className}`}>
      {/* Top Player & Captured Pieces Bar */}
      {showCapturedPieces && (
        <CapturedPiecesBar
          name={topPlayerName}
          color={topColor}
          isTurn={chess.turn() === topColor}
          capturedItems={topCapturedItems}
          materialDiff={topAdvantage}
          width={boardContainerWidth}
          isTop={true}
        />
      )}

      {/* Middle Row: Eval Bar + Chessboard Container */}
      <div
        ref={boardContainerRef}
        className="flex items-stretch justify-center flex-1 min-h-0 max-h-full max-w-full relative"
      >
        {/* Eval Bar on the left */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center rounded-l-md mr-1.5 shadow-md relative h-full ${
          showEvalBar ? 'w-6 sm:w-7 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Top portion (Black if straight, White if flipped) */}
        <div
          className="w-full transition-all duration-300 bg-[#2b2b2b] relative flex items-start justify-center pt-1"
          style={{ height: `${barTopFillPercent}%` }}
        >
          {barTopFillPercent > 65 && (
            <span className="text-[10px] font-bold text-white tracking-tighter">
              {evalScore}
            </span>
          )}
        </div>
        {/* Bottom portion (White if straight, Black if flipped) */}
        <div
          className="w-full transition-all duration-300 bg-[#ffffff] relative flex items-end justify-center pb-1 flex-1"
        >
          {barTopFillPercent <= 65 && (
            <span className="text-[10px] font-bold text-slate-900 tracking-tighter">
              {evalScore}
            </span>
          )}
        </div>
      </div>

      {/* Chessboard container - naturally square and fills parent height */}
      <div
        ref={boardRef}
        className="relative rounded-md overflow-hidden shadow-2xl border border-[#2b3347] bg-[#b58863] h-full aspect-square max-h-full max-w-full"
      >
        {/* 8x8 Board Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {displayRanks.map((rank, rowIdx) =>
            displayFiles.map((file, colIdx) => {
              const sq = `${file}${rank}`;
              const isDark = (colIdx + rowIdx) % 2 === 1;
              const isSelected = selectedSquare === sq;
              const isLastFrom = lastMove?.from === sq;
              const isLastTo = lastMove?.to === sq;
              const isWrong = wrongSquare === sq;
              const isKingInCheck =
                chess.inCheck() &&
                boardState[sq]?.type === 'K' &&
                boardState[sq]?.color === chess.turn();

              const piece = boardState[sq];
              const isDragged = draggedSquare === sq;
              const isLegalDest = legalMoves.some(m => m.to === sq);
              const isCapture = legalMoves.find(m => m.to === sq)?.isCapture;

              let bgClass = isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]';
              if (isWrong) {
                bgClass = 'bg-red-500/80 animate-pulse';
              } else if (isLastFrom || isLastTo) {
                bgClass = isDark ? 'bg-[#aaa23a]' : 'bg-[#cdd26a]';
              } else if (isSelected) {
                bgClass = isDark ? 'bg-[#7fa650]' : 'bg-[#badc58]';
              }

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  onMouseDown={(e) => handleMouseDown(e, sq)}
                  onTouchStart={(e) => handleTouchStart(e, sq)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${bgClass} ${
                    isWrong ? 'animate-shake' : ''
                  }`}
                >
                  {/* In-check highlight */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-600/40 rounded-full blur-[2px]" />
                  )}

                  {/* Legal move hints */}
                  {isLegalDest && !isCapture && (
                    <div className="w-3.5 h-3.5 rounded-full bg-black/20 pointer-events-none z-10" />
                  )}
                  {isLegalDest && isCapture && (
                    <div className="absolute inset-1 rounded-full border-4 border-black/25 pointer-events-none z-10" />
                  )}

                  {/* Piece */}
                  {piece && !isDragged && (() => {
                    const isAnimatingPiece = animatingMove && animatingMove.to === sq;
                    let animStyle: React.CSSProperties | undefined;
                    if (isAnimatingPiece) {
                      const fromCol = displayFiles.indexOf(animatingMove.from[0]);
                      const fromRow = displayRanks.indexOf(animatingMove.from[1]);
                      const toCol = displayFiles.indexOf(animatingMove.to[0]);
                      const toRow = displayRanks.indexOf(animatingMove.to[1]);
                      const deltaX = (fromCol - toCol) * 100;
                      const deltaY = (fromRow - toRow) * 100;
                      animStyle = {
                        transform: animatingMove.active ? 'translate(0px, 0px)' : `translate(${deltaX}%, ${deltaY}%)`,
                        transition: animatingMove.active ? 'transform 240ms cubic-bezier(0.2, 0, 0.2, 1)' : 'none',
                        zIndex: 25
                      };
                    }

                    const PieceComp = ChessPieces[`${piece.color}${piece.type}`];
                    return (
                      <div
                        style={animStyle}
                        className={`w-[88%] h-[88%] flex items-center justify-center transition-transform duration-75 ${
                          isAnimatingPiece ? 'z-20 pointer-events-none' : 'z-10'
                        }`}
                      >
                        {PieceComp ? <PieceComp className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" /> : null}
                      </div>
                    );
                  })()}

                  {/* Board Coordinates */}
                  {colIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[11px] font-bold select-none ${
                        isDark ? 'text-[#f0d9b5]' : 'text-[#b58863]'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rowIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[11px] font-bold select-none ${
                        isDark ? 'text-[#f0d9b5]' : 'text-[#b58863]'
                      }`}
                    >
                      {file}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SVG Overlay for Arrows */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="arrow-gold"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0.5, 3.5 2, 0 3.5" fill="#e5a93c" />
            </marker>
            <marker
              id="arrow-blue"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0.5, 3.5 2, 0 3.5" fill="#38bdf8" />
            </marker>
          </defs>

          {arrows.map((arr, i) => {
            const start = getSquareCenter(arr.from);
            const end = getSquareCenter(arr.to);
            if (!start || !end) return null;

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.hypot(dx, dy);
            if (len === 0) return null;

            const shorten = 3.5;
            const x2 = end.x - (dx / len) * shorten;
            const y2 = end.y - (dy / len) * shorten;

            const isGold = !arr.color || arr.color.includes('e5a93c') || arr.color.includes('amber');
            const strokeColor = arr.color || '#e5a93c';
            const markerId = isGold ? 'url(#arrow-gold)' : 'url(#arrow-blue)';

            return (
              <g key={i} opacity={arr.opacity ?? 0.85}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  markerEnd={markerId}
                />
              </g>
            );
          })}
        </svg>

        {/* Dragged Piece following cursor */}
        {draggedSquare && dragPos && boardRef.current && (
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: dragPos.x,
              top: dragPos.y,
              width: boardRef.current.clientWidth / 8,
              height: boardRef.current.clientHeight / 8
            }}
          >
            {(() => {
              const piece = boardState[draggedSquare];
              if (!piece) return null;
              const PieceComp = ChessPieces[`${piece.color}${piece.type}`];
              return PieceComp ? <PieceComp className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] scale-110" /> : null;
            })()}
          </div>
        )}
        </div>
      </div>

      {/* Bottom Player & Captured Pieces Bar */}
      {showCapturedPieces && (
        <CapturedPiecesBar
          name={bottomPlayerName}
          color={bottomColor}
          isTurn={chess.turn() === bottomColor}
          capturedItems={bottomCapturedItems}
          materialDiff={bottomAdvantage}
          width={boardContainerWidth}
          isTop={false}
        />
      )}
    </div>
  );
};
