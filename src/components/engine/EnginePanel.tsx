import React, { useState } from 'react';
import { Cpu, ChevronUp, ChevronDown, Plus, Settings } from 'lucide-react';
import { EngineEvaluation, EngineLine } from '../../utils/stockfishService';
import { EngineSettingsModal } from './EngineSettingsModal';
import { EngineSettings } from '../../types';

interface EnginePanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  evaluation: EngineEvaluation;
  settings: EngineSettings;
  onUpdateSettings: (settings: EngineSettings) => void;
  onExtendDepth?: () => void;
}

export const EnginePanel: React.FC<EnginePanelProps> = ({
  enabled,
  onToggle,
  evaluation,
  settings,
  onUpdateSettings,
  onExtendDepth
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    <div className="w-full bg-[#181d2a] border border-[#2b3347] rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Top Header Bar (matches Image 5) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1e2433] border-b border-[#2b3347]">
        {/* Left: Switch + Eval Score + Badge */}
        <div className="flex items-center space-x-3">
          {/* Amber toggle switch */}
          <button
            onClick={() => onToggle(!enabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              enabled ? 'bg-[#e5a93c]' : 'bg-[#374151]'
            }`}
          >
            <div
              className={`bg-[#131722] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Current Evaluation Score */}
          {enabled ? (
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg text-white">
                {evaluation.evalScore}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                SF 19
              </span>
              <span className="text-xs font-bold text-[#e5a93c] bg-[#e5a93c]/15 px-1.5 py-0.5 rounded">
                NNUE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                d{evaluation.depth}
              </span>
              {onExtendDepth && (
                <button
                  onClick={onExtendDepth}
                  title="Extend Depth"
                  className="text-slate-400 hover:text-white p-0.5 rounded transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400">
              Stockfish Engine Off
            </span>
          )}
        </div>

        {/* Right: Settings & Hide/Show button */}
        <div className="flex items-center space-x-2">
          {enabled && (
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Engine Settings"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#283145] transition"
            >
              <Cpu className="w-4 h-4" />
            </button>
          )}

          {enabled && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-xs font-medium text-slate-300 hover:text-white bg-[#252c3e] hover:bg-[#2e374e] px-2.5 py-1 rounded-md border border-[#37415a] transition"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multi-PV lines (matches Image 5) */}
      {enabled && isExpanded && (
        <div className="divide-y divide-[#242b3d] text-xs font-mono">
          {evaluation.lines.length > 0 ? (
            evaluation.lines.slice(0, settings.lines).map((line: EngineLine, idx: number) => (
              <div
                key={idx}
                className="flex items-center px-3.5 py-2 hover:bg-[#202738] transition cursor-pointer"
              >
                {/* Score */}
                <span className="w-12 font-bold text-slate-200">
                  {line.formattedScore}
                </span>

                {/* Variation Moves */}
                <span className="flex-1 text-slate-300 font-sans text-xs truncate pl-2">
                  {line.pvSan || 'Analyzing...'}
                </span>

                {/* Depth info or expand */}
                <span className="text-[10px] text-slate-500 font-mono ml-2">
                  d{line.depth}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-slate-400 text-xs text-center font-sans">
              Calculating variations...
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <EngineSettingsModal
          settings={settings}
          onSave={(newSettings) => {
            onUpdateSettings(newSettings);
            setShowSettingsModal(false);
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
