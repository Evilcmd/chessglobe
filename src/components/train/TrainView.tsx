import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy
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
  onUpdateRepertoire,
  boardSize = 640
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
        }, 360);
        return () => clearTimeout(timer);
      }
    } else if (moves.length > 0 && moveIndex === moves.length && !lineFinished) {
      // Completed current line!
      setLineFinished(true);

      if (!lineHasMistake && !showMoveRevealed) {
        // Line solved CLEANLY!
        setSolvedSuccessfully(true);
        sound.playSuccess();
        updateLineStatus(repertoire.id, currentLine.id, { trained: true });

        // Update local trained set so count updates immediately
        setTrainedLineIds(prev => new Set([...prev, currentLine.id]));
        onUpdateRepertoire?.();

        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Remove from current rotation queue
        setQueue(prevQueue => {
          const nextQ = prevQueue.filter(idx => idx !== currentLineIndex);
          if (nextQ.length === 0) {
            setAllMastered(true);
          }
          return nextQ;
        });
      } else {
        // Solved with mistake(s)
        setSolvedSuccessfully(false);
        sound.playWrong();
        // Keep in queue by putting it at the end of the rotation
        setQueue(prevQueue => {
          const filtered = prevQueue.filter(idx => idx !== currentLineIndex);
          return [...filtered, currentLineIndex];
        });
      }
    }
  }, [
    moveIndex,
    moves,
    playerColor,
    lineFinished,
    lineHasMistake,
    showMoveRevealed,
    currentLineIndex,
    repertoire.id,
    currentLine?.id,
    allMastered,
    onUpdateRepertoire
  ]);

  // Handle user making a move
  const handleUserMove = (from: string, to: string) => {
    if (moveIndex >= moves.length || lineFinished) return;
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

        // Hide "Show Move" button and arrow on correct move!
        setShowMistakeUI(false);
        setShowMoveRevealed(false);
      } else {
        // Wrong move!
        sound.playWrong();
        setWrongSquare(from);
        setLineHasMistake(true);
        setShowMistakeUI(true); // Show button for this move!

        // Mark line as untrained and record mistake immediately
        updateLineStatus(repertoire.id, currentLine.id, { mistake: true, trained: false });
        setTimeout(() => setWrongSquare(null), 500);
      }
    }
  };

  // Advance to next line in rotation
  const advanceToNextLine = () => {
    if (queue.length === 0) {
      setAllMastered(true);
      return;
    }

    // Pick next line from rotation
    const nextIdx = queue[0];
    setCurrentLineIndex(nextIdx);
    setMoveIndex(0);
    setLineHasMistake(false);
    setShowMistakeUI(false);
    setShowMoveRevealed(false);
    setLineFinished(false);
    setSolvedSuccessfully(false);
    setWrongSquare(null);
  };

  // Reveal correct move when user clicks "Show Move"
  const handleShowMove = () => {
    setShowMoveRevealed(true);
    setLineHasMistake(true);
    updateLineStatus(repertoire.id, currentLine.id, { mistake: true, trained: false });
  };

  // Reset training progress
  const handleResetTraining = () => {
    resetTrainingProgress(repertoire.id);
    const allIndices = repertoire.lines.map((_, i) => i).sort(() => Math.random() - 0.5);
    setTrainedLineIds(new Set());
    onUpdateRepertoire?.();
    setQueue(allIndices);
    setCurrentLineIndex(allIndices[0]);
    setMoveIndex(0);
    setLineHasMistake(false);
    setShowMistakeUI(false);
    setShowMoveRevealed(false);
    setLineFinished(false);
    setAllMastered(false);
    setSolvedSuccessfully(false);
  };

  const totalTrainedCount = trainedLineIds.size;

  return (
    <div className="flex flex-col min-h-screen bg-[#131722] text-slate-100">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#242b3c] bg-[#181d2a]">
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
              <Target className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-white">Train</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              • {repertoire.name}
            </span>
          </div>
        </div>

        {/* Rotation queue status & Flip board button */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-slate-300 bg-[#22293b] px-3 py-1.5 rounded-lg border border-[#2e374e]">
            Rotation Queue: <strong className="text-[#e5a93c]">{queue.length}</strong> remaining
          </span>

          <button
            onClick={() => setIsFlippedManual(!isFlippedManual)}
            title="Flip Board (White / Black)"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#242b3d] transition border border-[#2e374d]"
          >
            <FlipBoardIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetTraining}
            title="Reset Training Progress"
            className="hidden sm:flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-white bg-[#202737] hover:bg-[#2a3449] px-2.5 py-1.5 rounded-lg border border-[#2e374d] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Progress Bar (Percentage of lines trained in this repertoire) */}
      <div className="w-full bg-[#1e2536] h-1.5 relative overflow-hidden">
        <div
          className="bg-[#e5a93c] h-full transition-all duration-300"
          style={{ width: `${(totalTrainedCount / repertoire.lines.length) * 100}%` }}
        />
      </div>

      {/* Main Container - Generous Desktop Scaling */}
      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center p-4 sm:p-6 lg:p-8 gap-6 lg:gap-10 max-w-[1400px] mx-auto w-full">
        {/* Left / Center: Board */}
        <div className="flex flex-col items-center w-full max-w-[min(680px,80vh)] xl:max-w-[min(740px,82vh)]">
          <div className="relative w-full">
            <ChessBoard
              fen={currentFen}
              orientation={isFlippedManual ? 'black' : 'white'}
              arrows={boardArrows}
              interactive={!lineFinished && !allMastered}
              onMove={handleUserMove}
              lastMove={lastMove}
              wrongSquare={wrongSquare}
              showEvalBar={false} /* NO engine in training */
              boardSize={boardSize}
            />

            {/* Success / Mistake Overlay when line finishes */}
            {lineFinished && !allMastered && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-md z-30 animate-fade-in">
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
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-md z-30 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#e5a93c]/20 text-[#e5a93c] flex items-center justify-center mb-4">
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
                    Return to Repertoires
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Training Status & Controls */}
        <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col space-y-4">
          {/* Training Header Card */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold bg-[#e5a93c]/20 text-[#e5a93c] px-2.5 py-1 rounded">
                Line #{currentLineIndex + 1}
              </span>
              <span className="text-xs text-slate-400">
                Move {moveIndex} of {moves.length}
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1 truncate">
              {currentLine.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate">
              {currentLine.keyMovesSummary}
            </p>

            <div className="mt-4 pt-4 border-t border-[#23293a] flex items-center justify-between text-xs">
              <span className="text-slate-400">Mastered Lines:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {totalTrainedCount} / {repertoire.lines.length} ({Math.round((totalTrainedCount / repertoire.lines.length) * 100)}%)
              </span>
            </div>
          </div>

          {/* Action Box: Training Instructions & "Show Move" Button */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl p-5 shadow-md flex flex-col items-center text-center">
            {showMistakeUI ? (
              <div className="w-full animate-fade-in">
                <div className="flex items-center justify-center space-x-2 text-rose-400 text-xs font-semibold mb-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>Incorrect move! You can keep trying.</span>
                </div>

                {/* Show Move Button (disappears as soon as the correct move is played!) */}
                <button
                  onClick={handleShowMove}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#262f44] hover:bg-[#323d57] text-[#e5a93c] border border-[#e5a93c]/40 font-bold text-xs rounded-xl transition shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Move</span>
                </button>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Make the correct opening move on the board from memory.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Opponent will reply automatically with sound and smooth piece movement. Solve cleanly to master!
                </p>
              </div>
            )}
          </div>

          {/* Quick Line Skip / Restart line */}
          <div className="flex items-center justify-between bg-[#181d2a] border border-[#2b3347] rounded-xl p-3 px-4 shadow-md">
            <span className="text-xs text-slate-400">Need to retry this line?</span>
            <button
              onClick={() => {
                setMoveIndex(0);
                setShowMistakeUI(false);
                setShowMoveRevealed(false);
                setLineFinished(false);
                setWrongSquare(null);
              }}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#22293b] hover:bg-[#2b344a] px-3 py-1.5 rounded-lg border border-[#2e374d] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Line</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
