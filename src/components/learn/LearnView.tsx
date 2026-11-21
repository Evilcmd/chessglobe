import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  List,
  Sparkles,
  HelpCircle,
  Play,
  Pause
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Repertoire, EngineSettings } from '../../types';
import { ChessBoard, ArrowData } from '../chess/ChessBoard';
import { FlipBoardIcon } from '../icons/FlipBoardIcon';
import { EnginePanel } from '../engine/EnginePanel';
import { LinesListModal } from '../lines/LinesListModal';
import { engineService, EngineEvaluation } from '../../utils/stockfishService';
import { sound } from '../../utils/sound';
import { updateLineStatus } from '../../utils/storage';

interface LearnViewProps {
  repertoire: Repertoire;
  initialLineIndex?: number;
  engineSettings: EngineSettings;
  onUpdateEngineSettings: (settings: EngineSettings) => void;
  onBack: () => void;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const LearnView: React.FC<LearnViewProps> = ({
  repertoire,
  initialLineIndex = 0,
  engineSettings,
  onUpdateEngineSettings,
  onBack
}) => {
  const [lineIndex, setLineIndex] = useState<number>(initialLineIndex);
  const [moveIndex, setMoveIndex] = useState<number>(0); // 0 = start of line
  const [isEngineOn, setIsEngineOn] = useState<boolean>(false);
  const [engineEval, setEngineEval] = useState<EngineEvaluation>({
    evalScore: '0.0',
    centipawns: 0,
    depth: 0,
    maxDepth: engineSettings.depth,
    lines: [],
    isThinking: false
  });
  const [showLinesModal, setShowLinesModal] = useState<boolean>(false);
  const [isFlippedManual, setIsFlippedManual] = useState<boolean>(repertoire.color === 'black');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const [showHintPulse, setShowHintPulse] = useState<boolean>(false);
  const [lineFinished, setLineFinished] = useState<boolean>(false);

  const currentLine = repertoire.lines[lineIndex] || repertoire.lines[0];
  const moves = currentLine?.moves || [];
  const playerColor = repertoire.color === 'white' ? 'w' : 'b';

  // Current board FEN
  const currentFen = useMemo(() => {
    if (moveIndex === 0) return START_FEN;
    return moves[moveIndex - 1]?.fen || START_FEN;
  }, [moves, moveIndex]);

  // Last move made on board
  const lastMove = useMemo(() => {
    if (moveIndex === 0) return null;
    const m = moves[moveIndex - 1];
    return m ? { from: m.from, to: m.to } : null;
  }, [moves, moveIndex]);

  // Expected move for player or opponent
  const nextExpectedMove = useMemo(() => {
    if (moveIndex >= moves.length) return null;
    return moves[moveIndex];
  }, [moves, moveIndex]);

  const isPlayerTurn = nextExpectedMove ? nextExpectedMove.color === playerColor : false;

  // Active arrows to display on the board
  const boardArrows = useMemo(() => {
    const list: ArrowData[] = [];

    // 1. Guidance arrow for the player's move in Learn mode
    if (isPlayerTurn && nextExpectedMove) {
      list.push({
        from: nextExpectedMove.from,
        to: nextExpectedMove.to,
        color: '#e5a93c',
        opacity: showHintPulse ? 1 : 0.85
      });
    }

    // 2. Engine best move arrow (if engine is enabled and best move arrow is toggled on)
    if (isEngineOn && engineSettings.showBestMoveArrow && engineEval.bestMove) {
      // If different from hint arrow, show in blue
      const isSameAsHint =
        isPlayerTurn &&
        nextExpectedMove &&
        engineEval.bestMove.from === nextExpectedMove.from &&
        engineEval.bestMove.to === nextExpectedMove.to;

      if (!isSameAsHint) {
        list.push({
          from: engineEval.bestMove.from,
          to: engineEval.bestMove.to,
          color: '#38bdf8',
          opacity: 0.75
        });
      }
    }

    return list;
  }, [isPlayerTurn, nextExpectedMove, showHintPulse, isEngineOn, engineSettings.showBestMoveArrow, engineEval.bestMove]);

  // Subscribe to Stockfish engine
  useEffect(() => {
    const unsub = engineService.subscribe((data) => {
      setEngineEval(data);
    });
    return () => unsub();
  }, []);

  // Update engine on position change
  useEffect(() => {
    if (isEngineOn) {
      engineService.evaluate(currentFen);
    } else {
      engineService.stop();
    }
  }, [currentFen, isEngineOn]);

  // When engine toggled
  const handleEngineToggle = (on: boolean) => {
    setIsEngineOn(on);
    if (on) {
      engineService.evaluate(currentFen);
    } else {
      engineService.stop();
    }
  };

  // Check if opponent needs to make their move automatically
  useEffect(() => {
    if (lineFinished) return;

    if (moveIndex < moves.length) {
      const nextM = moves[moveIndex];
      // If it's opponent's turn, make it automatically with a short delay
      if (nextM && nextM.color !== playerColor) {
        const timer = setTimeout(() => {
          if (nextM.captured) {
            sound.playCapture();
          } else {
            sound.playMove();
          }
          setMoveIndex(prev => prev + 1);
        }, 400);
        return () => clearTimeout(timer);
      }
    } else if (moves.length > 0 && moveIndex === moves.length && !lineFinished) {
      // Completed line!
      setLineFinished(true);
      sound.playSuccess();
      updateLineStatus(repertoire.id, currentLine.id, { learned: true });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [moveIndex, moves, playerColor, lineFinished, repertoire.id, currentLine.id]);

  // Handle user making a move on the board
  const handleUserMove = (from: string, to: string) => {
    if (moveIndex >= moves.length || lineFinished) return;
    const expected = moves[moveIndex];
    if (!expected) return;

    // Check if it's player's turn and matches expected move
    if (expected.color === playerColor) {
      if (expected.from === from && expected.to === to) {
        // Correct move!
        if (expected.captured) {
          sound.playCapture();
        } else {
          sound.playMove();
        }
        setMoveIndex(prev => prev + 1);
        setWrongSquare(null);
      } else {
        // Wrong move!
        sound.playWrong();
        setWrongSquare(from);
        setTimeout(() => setWrongSquare(null), 500);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevMove();
      } else if (e.key === 'ArrowRight') {
        goToNextMove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveIndex, moves.length]);

  const goToFirstMove = () => {
    setMoveIndex(0);
    setLineFinished(false);
  };

  const goToPrevMove = () => {
    if (moveIndex > 0) {
      setMoveIndex(prev => prev - 1);
      setLineFinished(false);
    }
  };

  const goToNextMove = () => {
    if (moveIndex < moves.length) {
      setMoveIndex(prev => prev + 1);
    }
  };

  const goToLastMove = () => {
    setMoveIndex(moves.length);
  };

  // Advance to next line
  const handleNextLine = () => {
    if (lineIndex < repertoire.lines.length - 1) {
      setLineIndex(prev => prev + 1);
      setMoveIndex(0);
      setLineFinished(false);
    }
  };

  const handlePrevLine = () => {
    if (lineIndex > 0) {
      setLineIndex(prev => prev - 1);
      setMoveIndex(0);
      setLineFinished(false);
    }
  };

  const handleResetLine = () => {
    setMoveIndex(0);
    setLineFinished(false);
  };

  // Get current position comment
  const currentComment = useMemo(() => {
    // Check if current move or previous move has comment
    if (moveIndex > 0 && moves[moveIndex - 1]?.comment) {
      return moves[moveIndex - 1].comment;
    }
    if (moves[moveIndex]?.comment) {
      return moves[moveIndex].comment;
    }
    return null;
  }, [moveIndex, moves]);

  // Overall learned count
  const totalLearned = repertoire.lines.filter(l => l.learned).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#131722] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#242b3c] bg-[#181d2a]">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-[#202737] hover:bg-[#2a3449] px-3 py-1.5 rounded-lg border border-[#2e374d] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Repertoire</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-[#e5a93c]/15 text-[#e5a93c]">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-white">Learn</span>
            <span className="text-xs text-slate-400 font-medium">
              • {repertoire.name}
            </span>
          </div>
        </div>

        {/* Line indicator and quick tools */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLinesModal(true)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#22293b] hover:bg-[#2b354d] px-3 py-1.5 rounded-lg border border-[#2d374d] transition"
          >
            <List className="w-3.5 h-3.5" />
            <span>All Lines ({lineIndex + 1}/{repertoire.lines.length})</span>
          </button>

          <button
            onClick={() => setIsFlippedManual(!isFlippedManual)}
            title="Flip Board (White / Black)"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#242b3d] transition border border-[#2e374d]"
          >
            <FlipBoardIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Thin Line Progress Bar */}
      <div className="w-full bg-[#1e2536] h-1.5 relative overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${((lineIndex + 1) / repertoire.lines.length) * 100}%` }}
        />
      </div>

      {/* Main Workspace (Board + Right Sidebar) - Generous Desktop Scaling */}
      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center p-4 sm:p-6 lg:p-8 gap-6 lg:gap-10 max-w-[1400px] mx-auto w-full">
        {/* Left / Center: Chessboard */}
        <div className="flex flex-col items-center w-full max-w-[min(680px,80vh)] xl:max-w-[min(740px,82vh)]">
          <div className="relative w-full">
            <ChessBoard
              fen={currentFen}
              orientation={isFlippedManual ? 'black' : 'white'}
              arrows={boardArrows}
              interactive={!lineFinished}
              onMove={handleUserMove}
              lastMove={lastMove}
              wrongSquare={wrongSquare}
              showEvalBar={isEngineOn}
              evalScore={engineEval.evalScore}
              centipawns={engineEval.centipawns}
              boardSize={engineSettings.boardSize}
            />

            {/* Line Finished Overlay Banner */}
            {lineFinished && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-md z-30 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Line Complete!
                </h3>
                <p className="text-xs text-slate-300 mb-5 max-w-xs">
                  You've successfully learned "{currentLine.name}".
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResetLine}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#252c3e] hover:bg-[#2e374e] rounded-xl border border-[#343e57] transition"
                  >
                    Replay Line
                  </button>
                  {lineIndex < repertoire.lines.length - 1 ? (
                    <button
                      onClick={handleNextLine}
                      className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] rounded-xl shadow-lg transition"
                    >
                      Next Line ({lineIndex + 2}/{repertoire.lines.length}) →
                    </button>
                  ) : (
                    <button
                      onClick={onBack}
                      className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition"
                    >
                      Finish Course
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (Comments, Speech Bubble Mascot, Engine Panel, Navigation) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col space-y-4">
          {/* Header Card (Line title + 1/23 progress) */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-[#e5a93c]/20 text-[#e5a93c] px-2 py-0.5 rounded">
                  Line {lineIndex + 1}/{repertoire.lines.length}
                </span>
                <span className="text-xs text-slate-400">
                  Move {moveIndex} of {moves.length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevLine}
                  disabled={lineIndex === 0}
                  title="Previous Line"
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextLine}
                  disabled={lineIndex >= repertoire.lines.length - 1}
                  title="Next Line"
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-white truncate">
              {currentLine.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
              {currentLine.keyMovesSummary}
            </p>
          </div>

          {/* Speech Bubble with Bird Mascot (matches Image 3) */}
          <div className="flex items-start space-x-3 bg-[#181d2a] border border-[#2b3347] rounded-2xl p-4 min-h-[140px] shadow-md">
            {/* Mascot Avatar */}
            <div className="w-11 h-11 flex-shrink-0 rounded-full bg-[#1e2434] border border-[#2e374d] p-1 flex items-center justify-center">
              <img
                src="/mascot.svg"
                alt="ChessAtlas Mascot"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Speech Bubble */}
            <div className="flex-1 bg-[#1e2433] border border-[#2e374e] rounded-2xl rounded-tl-none p-3.5 relative shadow-sm">
              <div className="absolute top-2 -left-2 w-2 h-2 bg-[#1e2433] border-l border-b border-[#2e374e] transform rotate-45" />

              {currentComment ? (
                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                  {currentComment}
                </p>
              ) : (
                <div className="text-xs text-slate-400 leading-relaxed">
                  {isPlayerTurn && nextExpectedMove ? (
                    <span>
                      Play <strong className="text-[#e5a93c]">{nextExpectedMove.san}</strong> on the board to proceed with the line.
                    </span>
                  ) : (
                    <span>
                      Follow the line and watch opponent responses carefully.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Move Navigation Controls (user requirement: go back or forth in moves) */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-xl p-3 flex items-center justify-between shadow-md">
            {/* Step Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={goToFirstMove}
                disabled={moveIndex === 0}
                title="First Move (<<)"
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#242b3d] transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPrevMove}
                disabled={moveIndex === 0}
                title="Previous Move (< / Left Arrow)"
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#242b3d] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextMove}
                disabled={moveIndex >= moves.length}
                title="Next Move (> / Right Arrow)"
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#242b3d] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastMove}
                disabled={moveIndex >= moves.length}
                title="Last Move (>>)"
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#242b3d] transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Reset / Hint Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowHintPulse(true);
                  setTimeout(() => setShowHintPulse(false), 1200);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#22293b] hover:bg-[#2a3449] border border-[#2d374d] transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#e5a93c]" />
                <span>Hint</span>
              </button>
              <button
                onClick={handleResetLine}
                title="Reset Line"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#242b3d] transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Engine Panel at bottom (matches Image 4 & 5) */}
          <EnginePanel
            enabled={isEngineOn}
            onToggle={handleEngineToggle}
            evaluation={engineEval}
            settings={engineSettings}
            onUpdateSettings={onUpdateEngineSettings}
            onExtendDepth={() => {
              const newDepth = Math.min(32, engineSettings.depth + 4);
              onUpdateEngineSettings({ ...engineSettings, depth: newDepth });
              engineService.setDepth(newDepth);
            }}
          />
        </div>
      </div>

      {/* Lines Modal */}
      {showLinesModal && (
        <LinesListModal
          lines={repertoire.lines}
          currentLineIndex={lineIndex}
          onSelectLine={(idx) => {
            setLineIndex(idx);
            setMoveIndex(0);
            setLineFinished(false);
          }}
          onClose={() => setShowLinesModal(false)}
        />
      )}
    </div>
  );
};
