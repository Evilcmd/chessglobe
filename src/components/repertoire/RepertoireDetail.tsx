import React, { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Target,
  RotateCcw,
  CheckCircle,
  Play,
  Search,
  BookOpen,
  Trash2,
  Trophy
} from 'lucide-react';
import { Repertoire } from '../../types';
import { resetLearningProgress, resetTrainingProgress } from '../../utils/storage';
import { getRepertoireMascot } from '../../utils/mascot';

interface RepertoireDetailProps {
  repertoire: Repertoire;
  onBack: () => void;
  onStartLearn: (lineIndex?: number) => void;
  onStartTrain: (lineIndex?: number) => void;
  onDelete: (id: string) => void;
  onReload: () => void;
}

export const RepertoireDetail: React.FC<RepertoireDetailProps> = ({
  repertoire,
  onBack,
  onStartLearn,
  onStartTrain,
  onDelete,
  onReload
}) => {
  const [search, setSearch] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showResetLearnModal, setShowResetLearnModal] = useState(false);
  const [showResetTrainModal, setShowResetTrainModal] = useState(false);

  const totalLines = repertoire.lines.length;
  const learnedCount = repertoire.lines.filter(l => l.learned).length;
  const trainedCount = repertoire.lines.filter(l => l.trained).length;
  const learnedPercent = totalLines > 0 ? Math.round((learnedCount / totalLines) * 100) : 0;
  const trainedPercent = totalLines > 0 ? Math.round((trainedCount / totalLines) * 100) : 0;

  // Find next unlearned line index (or 0)
  const nextUnlearnedIndex = repertoire.lines.findIndex(l => !l.learned);
  const startLearnIndex = nextUnlearnedIndex !== -1 ? nextUnlearnedIndex : 0;

  // Find next untrained line index (or 0)
  const nextUntrainedIndex = repertoire.lines.findIndex(l => !l.trained);
  const startTrainIndex = nextUntrainedIndex !== -1 ? nextUntrainedIndex : 0;

  const filteredLines = repertoire.lines.filter((l, i) => {
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.keyMovesSummary.toLowerCase().includes(q) ||
      `line ${i + 1}`.includes(q)
    );
  });

  const confirmResetLearn = () => {
    resetLearningProgress(repertoire.id);
    setShowResetLearnModal(false);
    onReload();
  };

  const confirmResetTrain = () => {
    resetTrainingProgress(repertoire.id);
    setShowResetTrainModal(false);
    onReload();
  };

  return (
    <div className="min-h-screen bg-[#131722] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#242b3c] bg-[#181d2a]">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-[#202737] hover:bg-[#2a3449] px-3 py-1.5 rounded-lg border border-[#2e374d] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Repertoires</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#232a3c] border border-[#2e374e] p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src={getRepertoireMascot(repertoire)} alt={repertoire.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white leading-tight">{repertoire.name}</h1>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    repertoire.color === 'white'
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-[#293246] text-slate-200 border border-[#3e4a64]'
                  }`}
                >
                  {repertoire.color}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete option */}
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-[#202737] transition"
          title="Delete Repertoire"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-8 flex-1">
        {/* Progress & Launch Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learn Card */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-[#38435f] transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Learn Opening</h3>
                    <p className="text-xs text-slate-400">Step-by-step with arrows, comments & engine</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  {learnedPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#202737] h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${learnedPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 mb-6">
                <span>{learnedCount} of {totalLines} lines mastered</span>
                <span>{totalLines - learnedCount} left to learn</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-[#23293a]">
              <button
                onClick={() => onStartLearn(startLearnIndex)}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{learnedCount === 0 ? 'Start Learning' : 'Continue Learning'}</span>
              </button>

              <button
                onClick={() => setShowResetLearnModal(true)}
                title="Reset Learning Progress"
                className="flex items-center space-x-1 px-3 py-2.5 text-xs text-slate-400 hover:text-white bg-[#202737] hover:bg-[#283247] rounded-xl border border-[#2e374d] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Train Card */}
          <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-[#38435f] transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e5a93c]/15 text-[#e5a93c] flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Train Opening</h3>
                    <p className="text-xs text-slate-400">Randomized spaced rotation without arrows</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-[#e5a93c] bg-[#e5a93c]/10 px-2.5 py-1 rounded-lg">
                  {trainedPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#202737] h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-[#e5a93c] h-full rounded-full transition-all duration-300"
                  style={{ width: `${trainedPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 mb-6">
                <span>{trainedCount} of {totalLines} lines mastered</span>
                <span>{totalLines - trainedCount} in rotation</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-[#23293a]">
              <button
                onClick={() => onStartTrain(startTrainIndex)}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-[#e5a93c] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{trainedCount === 0 ? 'Start Training' : 'Continue Training'}</span>
              </button>

              <button
                onClick={() => setShowResetTrainModal(true)}
                title="Reset Training Progress"
                className="flex items-center space-x-1 px-3 py-2.5 text-xs text-slate-400 hover:text-white bg-[#202737] hover:bg-[#283247] rounded-xl border border-[#2e374d] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lines Breakdown Section */}
        <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl overflow-hidden shadow-xl">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-[#23293a] gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">All Repertoire Lines</h2>
              <p className="text-xs text-slate-400">
                Explore, jump into learning, or drill any specific branch
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lines or moves..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1e2434] border border-[#2d364c] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e5a93c]"
              />
            </div>
          </div>

          {/* Table / List */}
          <div className="divide-y divide-[#23293a]">
            {filteredLines.map((line) => {
              const originalIndex = repertoire.lines.findIndex(l => l.id === line.id);

              return (
                <div
                  key={line.id}
                  className="p-4 hover:bg-[#1e2435] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold bg-[#262f44] text-slate-300 px-2.5 py-1.5 rounded-lg mt-0.5">
                      #{originalIndex + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-bold text-white truncate">
                          {line.name}
                        </h4>

                        {line.learned && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle className="w-3 h-3" />
                            <span>Learned</span>
                          </span>
                        )}

                        {line.trained && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#e5a93c] bg-[#e5a93c]/10 px-2 py-0.5 rounded-md">
                            <Target className="w-3 h-3" />
                            <span>Trained</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-400 truncate mt-1">
                        {line.keyMovesSummary}
                      </p>

                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {line.moves.length} moves • {line.moves.filter(m => m.comment).length} comments
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-auto">
                    <button
                      onClick={() => onStartLearn(originalIndex)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#262f44] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 transition"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Learn</span>
                    </button>

                    <button
                      onClick={() => onStartTrain(originalIndex)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#262f44] hover:bg-[#e5a93c] hover:text-slate-950 text-slate-200 transition"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Train</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredLines.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No lines found matching "{search}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1b2130] border border-[#2e374d] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">Delete Repertoire?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Are you sure you want to delete "{repertoire.name}"? All your learning and training progress will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(repertoire.id);
                  setShowConfirmDelete(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Learn Confirmation Modal */}
      {showResetLearnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1b2130] border border-[#2e374d] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-emerald-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Learning Progress?</h3>
                <span className="text-xs text-slate-400">All lines return to unlearned</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to reset your learning progress for <strong className="text-white">"{repertoire.name}"</strong>? Your training progress will not be affected.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetLearnModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-[#202737] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetLearn}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition shadow-md"
              >
                Reset Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Train Confirmation Modal */}
      {showResetTrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1b2130] border border-[#2e374d] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-[#e5a93c] mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#e5a93c]/15 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-[#e5a93c]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Training Progress?</h3>
                <span className="text-xs text-slate-400">All lines return to untrained</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to reset your training stats and mastery for <strong className="text-white">"{repertoire.name}"</strong>? Your learned lines will stay learned.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetTrainModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-[#202737] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetTrain}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f3b544] rounded-lg transition shadow-md"
              >
                Reset Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
