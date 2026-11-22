import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Clock,
  GraduationCap,
  Target,
  Layers,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Repertoire } from '../../types';
import { getRepertoireMascot } from '../../utils/mascot';

interface DashboardProps {
  repertoires: Repertoire[];
  onSelectRepertoire: (rep: Repertoire) => void;
  onOpenNewModal: () => void;
  onQuickLearn: (rep: Repertoire) => void;
  onQuickTrain: (rep: Repertoire) => void;
  onDeleteRepertoire: (id: string) => void;
  onRestoreDefaults: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  repertoires,
  onSelectRepertoire,
  onOpenNewModal,
  onQuickLearn,
  onQuickTrain,
  onDeleteRepertoire,
  onRestoreDefaults
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const [repertoireToDelete, setRepertoireToDelete] = useState<Repertoire | null>(null);

  const whiteRepertoires = repertoires.filter(r => r.color === 'white' && (showArchived || !r.archived));
  const blackRepertoires = repertoires.filter(r => r.color === 'black' && (showArchived || !r.archived));

  return (
    <div className="min-h-screen bg-[#131722] text-slate-100 flex flex-col">
      {/* Top Header (matches Image 1) */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#242b3c] bg-[#181d2a]">
        <div className="flex items-center space-x-3.5">
          {/* Mascot Icon */}
          <div className="w-10 h-10 rounded-full bg-[#1e2434] p-1 flex items-center justify-center border border-[#2d374e] shadow-md">
            <img src="/mascot.svg" alt="Mascot" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            My Repertoire
          </h1>
        </div>

        {/* Right tools: Show archived toggle, Restore Defaults & New repertoire button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onRestoreDefaults}
            title="Restore 4 Default Openings"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-[#202737] hover:bg-[#283247] px-3 py-2 rounded-xl border border-[#2e374d] transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restore Defaults</span>
          </button>

          <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded bg-[#202737] border-[#2e374d] text-[#e5a93c] focus:ring-0"
            />
            <span>Show archived</span>
          </label>

          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-2 px-4 py-2 bg-[#202737] hover:bg-[#2b354c] border border-[#2e384e] hover:border-[#e5a93c] text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4 text-[#e5a93c]" />
            <span>New repertoire</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-8 py-8 space-y-10 flex-1">
        {/* Section: White Repertoires */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3.5 h-3.5 rounded-sm bg-white" />
            <h2 className="text-sm font-bold text-slate-300">White</h2>
            <span className="text-xs font-mono font-semibold bg-[#202636] text-slate-400 px-2 py-0.5 rounded-full">
              {whiteRepertoires.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {whiteRepertoires.map((rep) => (
              <RepertoireCard
                key={rep.id}
                repertoire={rep}
                onClick={() => onSelectRepertoire(rep)}
                onLearn={() => onQuickLearn(rep)}
                onTrain={() => onQuickTrain(rep)}
                onDelete={() => setRepertoireToDelete(rep)}
              />
            ))}

            {whiteRepertoires.length === 0 && (
              <div
                onClick={onOpenNewModal}
                className="border-2 border-dashed border-[#232a3c] hover:border-[#e5a93c]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#161a25]/50 group"
              >
                <Plus className="w-6 h-6 text-slate-500 group-hover:text-[#e5a93c] transition mb-2" />
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
                  Create a White Repertoire
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section: Black Repertoires */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3.5 h-3.5 rounded-sm bg-slate-900 border border-slate-600" />
            <h2 className="text-sm font-bold text-slate-300">Black</h2>
            <span className="text-xs font-mono font-semibold bg-[#202636] text-slate-400 px-2 py-0.5 rounded-full">
              {blackRepertoires.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blackRepertoires.map((rep) => (
              <RepertoireCard
                key={rep.id}
                repertoire={rep}
                onClick={() => onSelectRepertoire(rep)}
                onLearn={() => onQuickLearn(rep)}
                onTrain={() => onQuickTrain(rep)}
                onDelete={() => setRepertoireToDelete(rep)}
              />
            ))}

            {blackRepertoires.length === 0 && (
              <div
                onClick={onOpenNewModal}
                className="border-2 border-dashed border-[#232a3c] hover:border-[#e5a93c]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#161a25]/50 group"
              >
                <Plus className="w-6 h-6 text-slate-500 group-hover:text-[#e5a93c] transition mb-2" />
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
                  Create a Black Repertoire
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {repertoireToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#181d2a] border border-[#2e374e] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100">
            <div className="flex items-center space-x-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Opening?</h3>
                <span className="text-xs text-slate-400">This action cannot be undone.</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-white">"{repertoireToDelete.name}"</strong>? All {repertoireToDelete.lines.length} lines, learned status, and training stats will be removed.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRepertoireToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-[#202737] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteRepertoire(repertoireToDelete.id);
                  setRepertoireToDelete(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition"
              >
                Delete Opening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Repertoire Card Component with Delete Button
const RepertoireCard: React.FC<{
  repertoire: Repertoire;
  onClick: () => void;
  onLearn: () => void;
  onTrain: () => void;
  onDelete: () => void;
}> = ({ repertoire, onClick, onLearn, onTrain, onDelete }) => {
  const totalLines = repertoire.lines.length;
  const learnedCount = repertoire.lines.filter(l => l.learned).length;
  const trainedCount = repertoire.lines.filter(l => l.trained).length;
  const learnedPercent = totalLines > 0 ? Math.round((learnedCount / totalLines) * 100) : 0;
  const trainedPercent = totalLines > 0 ? Math.round((trainedCount / totalLines) * 100) : 0;
  const isLearnComplete = learnedPercent === 100;
  const isTrainComplete = trainedPercent === 100;

  return (
    <div
      onClick={onClick}
      className="bg-[#181d2a] hover:bg-[#1e2434] border border-[#2b3347] hover:border-[#38435d] rounded-2xl p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Mascot Cover Artwork Thumbnail */}
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-xl bg-[#232a3c] border border-[#2e374e] p-1.5 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
            <img src={getRepertoireMascot(repertoire)} alt={repertoire.name} className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white truncate group-hover:text-[#e5a93c] transition-colors">
                {repertoire.name}
              </h3>
            </div>

            {/* Counts for learned and trained */}
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]" title={`${learnedCount} of ${totalLines} learned`}>
                <GraduationCap className="w-3 h-3 text-emerald-400" />
                <span>{learnedCount}/{totalLines}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center space-x-1 text-[#e5a93c] font-mono text-[11px]" title={`${trainedCount} of ${totalLines} trained`}>
                <Target className="w-3 h-3 text-[#e5a93c]" />
                <span>{trainedCount}/{totalLines}</span>
              </span>
            </div>

            {/* Subtitle status: e.g. "38 to learn" or "Review ready" */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1.5">
              {isLearnComplete && isTrainComplete ? (
                <>
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">100% Mastered</span>
                </>
              ) : isLearnComplete ? (
                <>
                  <Clock className="w-3 h-3 text-[#e5a93c]" />
                  <span className="text-[#e5a93c] font-medium">{totalLines - trainedCount} to train</span>
                </>
              ) : (
                <>
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>{totalLines - learnedCount} to learn</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Two Donut Progress Indicators (Learn & Train) & Delete button */}
        <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete opening"
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-2.5">
            {/* Donut 1: Learn Progress (Emerald Green) */}
            <div
              className="flex flex-col items-center"
              title={`Learn Progress: ${learnedCount}/${totalLines} lines (${learnedPercent}%)`}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#242c3e]"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400"
                    strokeDasharray={`${learnedPercent}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white font-mono">
                  {learnedPercent}%
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 mt-1 flex items-center space-x-0.5">
                <GraduationCap className="w-3 h-3" />
                <span>Learn</span>
              </span>
            </div>

            {/* Donut 2: Train Progress (Amber / Gold) */}
            <div
              className="flex flex-col items-center"
              title={`Train Progress: ${trainedCount}/${totalLines} lines (${trainedPercent}%)`}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#242c3e]"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#e5a93c]"
                    strokeDasharray={`${trainedPercent}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white font-mono">
                  {trainedPercent}%
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#e5a93c] mt-1 flex items-center space-x-0.5">
                <Target className="w-3 h-3" />
                <span>Train</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons on Card Bottom */}
      <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-[#23293a]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLearn();
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#202737] hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-semibold text-xs rounded-lg transition"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Learn</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrain();
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#202737] hover:bg-[#e5a93c] hover:text-slate-950 text-slate-300 font-semibold text-xs rounded-lg transition"
        >
          <Target className="w-3.5 h-3.5" />
          <span>Train</span>
        </button>
      </div>
    </div>
  );
};
