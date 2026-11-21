import React, { useState } from 'react';
import { X, CheckCircle, Target, ArrowRight, Search } from 'lucide-react';
import { RepertoireLine } from '../../types';

interface LinesListModalProps {
  lines: RepertoireLine[];
  currentLineIndex: number;
  onSelectLine: (index: number) => void;
  onClose: () => void;
  title?: string;
}

export const LinesListModal: React.FC<LinesListModalProps> = ({
  lines,
  currentLineIndex,
  onSelectLine,
  onClose,
  title = 'Repertoire Lines'
}) => {
  const [search, setSearch] = useState('');

  const filtered = lines.filter((line, idx) => {
    const q = search.toLowerCase();
    return (
      line.name.toLowerCase().includes(q) ||
      line.keyMovesSummary.toLowerCase().includes(q) ||
      `line ${idx + 1}`.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b3347]">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400">
              Total {lines.length} lines • {lines.filter(l => l.learned).length} learned • {lines.filter(l => l.trained).length} trained
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#252c3e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-3 border-b border-[#23293a] bg-[#141824]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lines or moves (e.g. 3...c5, King's Indian)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e2434] border border-[#2d364c] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e5a93c]"
            />
          </div>
        </div>

        {/* Lines List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#23293a] p-2">
          {filtered.map((line) => {
            const originalIndex = lines.findIndex(l => l.id === line.id);
            const isCurrent = originalIndex === currentLineIndex;

            return (
              <div
                key={line.id}
                onClick={() => {
                  onSelectLine(originalIndex);
                  onClose();
                }}
                className={`p-3.5 rounded-xl cursor-pointer transition flex items-center justify-between ${
                  isCurrent
                    ? 'bg-[#252d40] border border-[#e5a93c]/50'
                    : 'hover:bg-[#1e2434]'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0 pr-4">
                  {/* Line Number Badge */}
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md mt-0.5 ${
                    isCurrent ? 'bg-[#e5a93c] text-slate-950' : 'bg-[#283247] text-slate-300'
                  }`}>
                    #{originalIndex + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {line.name}
                      </h4>
                      {line.learned && (
                        <span title="Learned" className="flex items-center text-emerald-400 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 fill-emerald-400/20" />
                        </span>
                      )}
                      {line.trained && (
                        <span title="Trained" className="flex items-center text-[#e5a93c] text-xs">
                          <Target className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate mt-1">
                      {line.keyMovesSummary}
                    </p>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {line.moves.length} moves
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLine(originalIndex);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2a3449] hover:bg-[#e5a93c] hover:text-slate-950 transition"
                  >
                    <span>Jump</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No lines found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
