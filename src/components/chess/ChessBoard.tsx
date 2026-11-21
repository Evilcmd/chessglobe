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
  boardSize?: number;
}

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
  boardSize = 560
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Parse position with chess.js
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch (_) {
      return new Chess();
    }
  }, [fen]);

  const isFlipped = orientation === 'black';

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

  // Legal moves from selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !interactive) return [];
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return moves.map(m => ({ to: m.to, isCapture: Boolean(m.captured) }));
    } catch (_) {
      return [];
    }
  }, [chess, selectedSquare, interactive]);

  // Clear selection if fen changes
  useEffect(() => {
    setSelectedSquare(null);
    setDraggedSquare(null);
    setDragPos(null);
  }, [fen]);

  // Handle square click
  const handleSquareClick = (sq: string) => {
    if (!interactive) return;

    // If already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }
      const isLegal = legalMoves.some(m => m.to === sq);
      if (isLegal && onMove) {
        const from = selectedSquare;
        setSelectedSquare(null);
        onMove(from, sq);
        return;
      }
    }

    // Select piece if it belongs to player's turn or has moves
    const piece = boardState[sq];
    if (piece) {
      const turn = chess.turn();
      // Allow selecting current turn's pieces
      if (piece.color === turn) {
        setSelectedSquare(sq);
        return;
      }
    }

    setSelectedSquare(null);
  };

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, sq: string) => {
    if (!interactive) return;
    const piece = boardState[sq];
    if (!piece || piece.color !== chess.turn()) return;

    setDraggedSquare(sq);
    setSelectedSquare(sq);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent, sq: string) => {
    if (!interactive) return;
    const piece = boardState[sq];
    if (!piece || piece.color !== chess.turn()) return;

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
          if (targetSq !== draggedSquare && onMove) {
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
          if (targetSq !== draggedSquare && onMove) {
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
  }, [draggedSquare, displayFiles, displayRanks, legalMoves, onMove]);

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
    // Sigmoid mapping -1000cp (-10) to +1000cp (+10) -> 0% to 100%
    const winChance = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
    let percent = 50 + winChance * 50;
    percent = Math.max(3, Math.min(97, percent));
    return percent;
  }, [centipawns]);

  // If flipped, invert eval bar display so player's color is at the bottom
  const barTopFillPercent = isFlipped ? whiteAdvantagePercent : 100 - whiteAdvantagePercent;

  return (
    <div className="flex items-stretch select-none justify-center w-full max-w-full">
      {/* Eval Bar on the left */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center rounded-l-md mr-1.5 shadow-md relative ${
          showEvalBar ? 'w-6 sm:w-7 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: boardSize }}
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

      {/* Chessboard container */}
      <div
        ref={boardRef}
        className="relative rounded-md overflow-hidden shadow-2xl border border-[#2b3347] bg-[#b58863] aspect-square w-full"
        style={{ maxWidth: boardSize }}
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

              // Square background color
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

                  {/* Board Coordinates on Edge Squares (Lichess style) */}
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

        {/* SVG Overlay for Arrows (Golden guidance arrow / Engine best-move arrow) */}
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

            // Shorten the end of the line slightly so arrowhead doesn't overlap center
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
  );
};
