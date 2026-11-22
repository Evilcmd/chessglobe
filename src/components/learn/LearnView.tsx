import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  List,
  Sparkles,
  HelpCircle,
  Play
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
import { getRepertoireMascot } from '../../utils/mascot';

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
    if (moveIndex > 0 && moves[moveIndex - 1]?.comment) {
      return moves[moveIndex - 1].comment;
    }
    if (moves[moveIndex]?.comment) {
      return moves[moveIndex].comment;
    }
    return null;
  }, [moveIndex, moves]);

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#0d111a] text-slate-100 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Container: Board on Left + Single Unified Card on Right (matching ChessAtlas Image 3) */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-4 lg:gap-6 w-full max-w-[1550px] h-full max-h-full">
        {/* Left Column: Full-Height Chessboard */}
        <div className="h-full flex-1 min-w-0 max-h-full flex items-center justify-center relative">
          <div className="relative h-full max-h-full flex items-center justify-center">
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
              className="h-full max-h-full"
            />

            {/* Line Finished Overlay Banner */}
            {lineFinished && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-xl z-30 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
                  <Sparkles className="w-7 h-7" />
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

        {/* Right Column: Unified Card (Top Header, Progress, Middle Speech Bubble, Bottom Engine & Controls) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] h-full max-h-full flex flex-col justify-between bg-[#161c28] border border-[#263043] rounded-2xl shadow-2xl p-5 overflow-hidden flex-shrink-0">
          {/* 1. Card Top Header (matches Image 3) */}
          <div className="flex items-center justify-between pb-3 border-b border-[#242c3f]">
            {/* Left: Mode Badge & Title */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#e5a93c]/15 text-[#e5a93c] flex items-center justify-center flex-shrink-0 border border-[#e5a93c]/25">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white leading-tight">Learn</div>
                <div className="text-xs text-slate-400 font-medium truncate max-w-[210px]">
                  {currentLine.name}
                </div>
              </div>
            </div>

            {/* Right: Actions (Flip, All Lines, Exit) */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={() => setIsFlippedManual(!isFlippedManual)}
                title="Flip Board (White / Black)"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202739] transition border border-transparent hover:border-[#2d374e]"
              >
                <FlipBoardIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLinesModal(true)}
                title="All Lines"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202739] transition border border-transparent hover:border-[#2d374e]"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={onBack}
                title="Exit to Repertoire"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202739] transition border border-transparent hover:border-[#2d374e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Progress Bar & Line Index */}
          <div className="flex items-center space-x-3 pt-3 pb-1">
            <div className="flex-1 bg-[#1e2536] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((lineIndex + 1) / repertoire.lines.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400 flex-shrink-0">
              {lineIndex + 1}/{repertoire.lines.length}
            </span>
          </div>

          {/* 3. Middle Section: Speech Bubble with Bird Mascot (matches Image 3) */}
          <div className="flex-1 min-h-0 py-3 flex flex-col justify-center">
            <div className="flex items-start space-x-2 sm:space-x-2.5 w-full">
              {/* Mascot Bird Avatar (matches Image 3: standalone mascot standing beside bubble) */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center filter drop-shadow-lg mt-0.5">
                <img
                  src={getRepertoireMascot(repertoire)}
                  alt="ChessAtlas Mascot"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Connector Dot between Mascot and Bubble (matches Image 3) */}
              <div className="flex items-center self-start mt-5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4a5878] border border-[#6b7d9e]" />
              </div>

              {/* Speech Bubble (White background, rounded card, bold readable text) */}
              <div className="relative flex-1 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90">
                {/* Triangular speech bubble tail pointing left to the connector dot */}
                <div className="absolute top-4 -left-2 w-3.5 h-3.5 bg-white transform rotate-45 border-l border-b border-slate-200/90 pointer-events-none" />

                {/* Inner scrollable text container with bold, comfortable sizing */}
                <div className="p-4 sm:p-5 max-h-[380px] xl:max-h-[440px] overflow-y-auto">
                  {currentComment ? (
                    <p className="text-[15.5px] sm:text-[16px] font-semibold text-slate-900 leading-[1.65] font-sans whitespace-pre-line tracking-[-0.01em] selection:bg-amber-100">
                      {currentComment}
                    </p>
                  ) : (
                    <div className="text-[15.5px] font-semibold text-slate-800 leading-relaxed font-sans">
                      {isPlayerTurn && nextExpectedMove ? (
                        <span>
                          Play <span className="inline-block px-2 py-0.5 mx-1 font-mono font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-md shadow-2xs text-base">{nextExpectedMove.san}</span> on the board to proceed with the line.
                        </span>
                      ) : (
                        <span>
                          Follow the line and observe the move carefully.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Bottom Section: Stockfish Engine Panel + Step Navigation Controls */}
          <div className="flex flex-col space-y-3 pt-3 border-t border-[#242c3f]">
            {/* Engine Panel */}
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

            {/* Move & Navigation Bar */}
            <div className="flex items-center justify-between bg-[#1e2538] border border-[#2b354c] rounded-xl px-3 py-2">
              {/* Step Controls: << < > >> */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={goToFirstMove}
                  disabled={moveIndex === 0}
                  title="First Move (<<)"
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#283248] transition"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToPrevMove}
                  disabled={moveIndex === 0}
                  title="Previous Move (< / Left Arrow)"
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#283248] transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1.5">
                  {moveIndex}/{moves.length}
                </span>
                <button
                  onClick={goToNextMove}
                  disabled={moveIndex >= moves.length}
                  title="Next Move (> / Right Arrow)"
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#283248] transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={goToLastMove}
                  disabled={moveIndex >= moves.length}
                  title="Last Move (>>)"
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#283248] transition"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Hint & Reset & Next Line */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowHintPulse(true);
                    setTimeout(() => setShowHintPulse(false), 1200);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#252e42] hover:bg-[#2e3952] border border-[#313c54] transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>Hint</span>
                </button>
                <button
                  onClick={handleResetLine}
                  title="Replay Line"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#283248] transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {lineFinished && lineIndex < repertoire.lines.length - 1 && (
                  <button
                    onClick={handleNextLine}
                    title="Next Line"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] shadow-md transition"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
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
