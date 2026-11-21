import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  X,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Repertoire } from '../../types';
import { ChessBoard, ArrowData } from '../chess/ChessBoard';
import { FlipBoardIcon } from '../icons/FlipBoardIcon';
import { sound } from '../../utils/sound';
import { updateLineStatus, resetTrainingProgress } from '../../utils/storage';

interface TrainViewProps {
  repertoire: Repertoire;
  onBack: () => void;
  onUpdateRepertoire?: () => void;
  boardSize?: number;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const TrainView: React.FC<TrainViewProps> = ({
  repertoire,
  onBack,
  onUpdateRepertoire
}) => {
  // Reactive tracking of trained line IDs so mastered count updates instantly in real time
  const [trainedLineIds, setTrainedLineIds] = useState<Set<string>>(
    () => new Set(repertoire.lines.filter(l => l.trained).map(l => l.id))
  );

  // Board orientation state (default straight for white, flipped for black)
  const [isFlippedManual, setIsFlippedManual] = useState<boolean>(repertoire.color === 'black');

  // Build initial queue of untrained line indices (or all lines if all are trained)
  const initialQueue = useMemo(() => {
    const untrainedIndices = repertoire.lines
      .map((line, idx) => ({ line, idx }))
      .filter(item => !item.line.trained)
      .map(item => item.idx);

    const pool = untrainedIndices.length > 0 ? untrainedIndices : repertoire.lines.map((_, i) => i);
    // Shuffle the rotation queue
    return [...pool].sort(() => Math.random() - 0.5);
  }, [repertoire]);

  const [queue, setQueue] = useState<number[]>(initialQueue);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(initialQueue[0] ?? 0);
  const [moveIndex, setMoveIndex] = useState<number>(0);

  // Separate line-level mistake tracking from current-move mistake UI
  const [lineHasMistake, setLineHasMistake] = useState<boolean>(false);
  const [showMistakeUI, setShowMistakeUI] = useState<boolean>(false);
  const [showMoveRevealed, setShowMoveRevealed] = useState<boolean>(false);
  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const [lineFinished, setLineFinished] = useState<boolean>(false);
  const [allMastered, setAllMastered] = useState<boolean>(false);
  const [solvedSuccessfully, setSolvedSuccessfully] = useState<boolean>(false);

  const currentLine = repertoire.lines[currentLineIndex] || repertoire.lines[0];
  const moves = currentLine?.moves || [];
  const playerColor = repertoire.color === 'white' ? 'w' : 'b';

  // Current board FEN
  const currentFen = useMemo(() => {
    if (moveIndex === 0) return START_FEN;
    return moves[moveIndex - 1]?.fen || START_FEN;
  }, [moves, moveIndex]);

  // Last move
  const lastMove = useMemo(() => {
    if (moveIndex === 0) return null;
    const m = moves[moveIndex - 1];
    return m ? { from: m.from, to: m.to } : null;
  }, [moves, moveIndex]);

  // Next expected move
  const nextExpectedMove = useMemo(() => {
    if (moveIndex >= moves.length) return null;
    return moves[moveIndex];
  }, [moves, moveIndex]);

  const isPlayerTurn = nextExpectedMove ? nextExpectedMove.color === playerColor : false;

  // In training, arrows are HIDDEN by default and appear ONLY when "Show Move" is clicked
  const boardArrows = useMemo(() => {
    const list: ArrowData[] = [];
    if (showMoveRevealed && isPlayerTurn && nextExpectedMove) {
      list.push({
        from: nextExpectedMove.from,
        to: nextExpectedMove.to,
        color: '#e5a93c',
        opacity: 0.95
      });
    }
    return list;
  }, [showMoveRevealed, isPlayerTurn, nextExpectedMove]);

  // Automatically make opponent moves
  useEffect(() => {
    if (lineFinished || allMastered) return;

    if (moveIndex < moves.length) {
      const nextM = moves[moveIndex];
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
      setShowMistakeUI(false);
      setShowMoveRevealed(false);

      if (!lineHasMistake) {
        // Mastered with zero mistakes!
        setSolvedSuccessfully(true);
        sound.playSuccess();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });

        // 1. Immediately update local state so mastered counter updates in real time
        setTrainedLineIds(prev => {
          const next = new Set(prev);
          next.add(currentLine.id);
          return next;
        });

        // 2. Persist to storage
        updateLineStatus(repertoire.id, currentLine.id, { trained: true });
        if (onUpdateRepertoire) onUpdateRepertoire();

        // 3. Remove this line from the rotation queue
        setQueue(prev => {
          const updated = prev.filter(idx => idx !== currentLineIndex);
          if (updated.length === 0) {
            setAllMastered(true);
          }
          return updated;
        });
      } else {
        // Line completed, but user made mistakes
        setSolvedSuccessfully(false);
        sound.playWrong();
        // Keep in queue and shuffle position to end
        setQueue(prev => {
          const remaining = prev.filter(idx => idx !== currentLineIndex);
          return [...remaining, currentLineIndex];
        });
      }
    }
  }, [
    moveIndex,
    moves,
    playerColor,
    lineFinished,
    allMastered,
    lineHasMistake,
    currentLine.id,
    currentLineIndex,
    repertoire.id,
    onUpdateRepertoire
  ]);

  // Handle user's move on the board
  const handleUserMove = (from: string, to: string) => {
    if (moveIndex >= moves.length || lineFinished || allMastered) return;
    const expected = moves[moveIndex];
    if (!expected) return;

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

        // Correct move played: dismiss the "Show Move" button and mistake alert
        setShowMistakeUI(false);
        setShowMoveRevealed(false);
      } else {
        // Mistake!
        sound.playWrong();
        setWrongSquare(from);
        setTimeout(() => setWrongSquare(null), 500);

        // Mark line as having a mistake (so it remains in rotation)
        setLineHasMistake(true);

        // Show the retry mistake UI with "Show Move" button
        setShowMistakeUI(true);
      }
    }
  };

  // "Show Move" button click
  const handleShowMove = () => {
    setShowMoveRevealed(true);
  };

  // Advance to next line from the rotation queue
  const advanceToNextLine = () => {
    if (queue.length === 0) {
      setAllMastered(true);
      return;
    }

    const nextLineIdx = queue[0];
    setCurrentLineIndex(nextLineIdx);
    setMoveIndex(0);
    setLineHasMistake(false);
    setShowMistakeUI(false);
    setShowMoveRevealed(false);
    setLineFinished(false);
    setSolvedSuccessfully(false);
  };

  // Restart current line
  const handleRetryLine = () => {
    setMoveIndex(0);
    setLineHasMistake(false);
    setShowMistakeUI(false);
    setShowMoveRevealed(false);
    setLineFinished(false);
    setSolvedSuccessfully(false);
  };

  // Reset all training progress for this repertoire
  const handleResetTraining = () => {
    if (confirm('Reset all training progress for this repertoire? All lines will return to untrained status.')) {
      resetTrainingProgress(repertoire.id);
      setTrainedLineIds(new Set());
      const allIndices = repertoire.lines.map((_, i) => i).sort(() => Math.random() - 0.5);
      setQueue(allIndices);
      setCurrentLineIndex(allIndices[0] ?? 0);
      setMoveIndex(0);
      setLineHasMistake(false);
      setShowMistakeUI(false);
      setShowMoveRevealed(false);
      setLineFinished(false);
      setAllMastered(false);
      setSolvedSuccessfully(false);
      if (onUpdateRepertoire) onUpdateRepertoire();
    }
  };

  const totalTrainedCount = trainedLineIds.size;

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#0d111a] text-slate-100 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Container: Full-Height Board on Left + Single Unified Card on Right */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-4 lg:gap-6 w-full max-w-[1550px] h-full max-h-full">
        {/* Left Column: Full-Height Chessboard */}
        <div className="h-full flex-1 min-w-0 max-h-full flex items-center justify-center relative">
          <div className="relative h-full max-h-full flex items-center justify-center">
            <ChessBoard
              fen={currentFen}
              orientation={isFlippedManual ? 'black' : 'white'}
              arrows={boardArrows}
              interactive={!lineFinished && !allMastered}
              onMove={handleUserMove}
              lastMove={lastMove}
              wrongSquare={wrongSquare}
              showEvalBar={false} /* Engine is disabled in training */
              className="h-full max-h-full"
            />

            {/* Line Finished Overlay Banner */}
            {lineFinished && !allMastered && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-xl z-30 animate-fade-in">
                {solvedSuccessfully ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Line Solved!
                    </h3>
                    <p className="text-xs text-slate-300 mb-5 max-w-xs">
                      Mastered cleanly! Removed from rotation.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 text-[#e5a93c] flex items-center justify-center mb-3 shadow-lg">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Line Completed with Errors
                    </h3>
                    <p className="text-xs text-slate-300 mb-5 max-w-xs">
                      This line remains in the training rotation until solved with zero mistakes.
                    </p>
                  </>
                )}

                <button
                  onClick={advanceToNextLine}
                  className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] rounded-xl shadow-lg transition"
                >
                  Next Random Line ({queue.length} left) →
                </button>
              </div>
            )}

            {/* All Lines Mastered Celebration Screen */}
            {allMastered && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-xl z-30 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#e5a93c]/20 text-[#e5a93c] flex items-center justify-center mb-4 shadow-xl">
                  <Trophy className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">
                  100% Trained!
                </h2>
                <p className="text-sm text-slate-300 mb-6 max-w-sm">
                  Congratulations! You have successfully solved all lines in this repertoire without any mistakes!
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResetTraining}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-300 bg-[#252c3e] hover:bg-[#2e374e] rounded-xl border border-[#343e57] transition"
                  >
                    Reset & Train Again
                  </button>
                  <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] rounded-xl shadow-lg transition"
                  >
                    Return to Repertoire
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unified Card (Top Header, Progress, Middle Interactive Area, Bottom Controls) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] h-full max-h-full flex flex-col justify-between bg-[#161c28] border border-[#263043] rounded-2xl shadow-2xl p-5 overflow-hidden flex-shrink-0">
          {/* 1. Card Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#242c3f]">
            {/* Left: Mode Badge & Title */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#e5a93c]/15 text-[#e5a93c] flex items-center justify-center flex-shrink-0 border border-[#e5a93c]/25">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white leading-tight">Train</div>
                <div className="text-xs text-slate-400 font-medium truncate max-w-[210px]">
                  Line #{currentLineIndex + 1} • {currentLine.name}
                </div>
              </div>
            </div>

            {/* Right: Actions (Flip, Reset Training, Exit) */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={() => setIsFlippedManual(!isFlippedManual)}
                title="Flip Board (White / Black)"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202739] transition border border-transparent hover:border-[#2d374e]"
              >
                <FlipBoardIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetTraining}
                title="Reset Training Progress"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202739] transition border border-transparent hover:border-[#2d374e]"
              >
                <RotateCcw className="w-4 h-4" />
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

          {/* 2. Progress Bar: Mastered lines count */}
          <div className="flex items-center space-x-3 pt-3 pb-1">
            <div className="flex-1 bg-[#1e2536] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#e5a93c] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(totalTrainedCount / repertoire.lines.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-[#e5a93c] flex-shrink-0">
              {totalTrainedCount}/{repertoire.lines.length}
            </span>
          </div>

          {/* 3. Middle Section: Training Instructions, Mistakes & Show Move Button */}
          <div className="flex-1 min-h-0 overflow-y-auto py-4 flex flex-col items-center justify-center text-center">
            {showMistakeUI ? (
              <div className="w-full max-w-sm flex flex-col items-center animate-fade-in p-4 bg-[#1e2435] border border-rose-500/30 rounded-2xl shadow-lg">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Incorrect move! You can keep trying.</span>
                </div>

                {/* Show Move Button (disappears immediately after the correct move is played!) */}
                <button
                  onClick={handleShowMove}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#262f44] hover:bg-[#323d57] text-[#e5a93c] border border-[#e5a93c]/40 font-bold text-xs rounded-xl transition shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Move</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 p-4">
                <div className="w-12 h-12 rounded-full bg-[#1b2131] border border-[#2b354b] p-1.5 flex items-center justify-center shadow-md">
                  <img
                    src="/mascot.svg"
                    alt="ChessAtlas Mascot"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">
                    Make your move from memory
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Play the expected opening moves. Opponent responses are made automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Bottom Section: Queue status & Line Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#242c3f]">
            <span className="text-xs text-slate-400 font-medium">
              Queue: <strong className="text-[#e5a93c] font-mono">{queue.length}</strong> lines left
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRetryLine}
                title="Restart Current Line"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#222a3d] hover:bg-[#2b354d] border border-[#2e374f] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
              <button
                onClick={advanceToNextLine}
                title="Next Line in Rotation"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] shadow-md transition"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
