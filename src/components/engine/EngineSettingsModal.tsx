import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EngineSettings } from '../../types';

interface EngineSettingsModalProps {
  settings: EngineSettings;
  onSave: (newSettings: EngineSettings) => void;
  onClose: () => void;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [depth, setDepth] = useState<number>(settings.depth);
  const [lines, setLines] = useState<number>(settings.lines);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(settings.showBestMoveArrow);
  const [boardSize, setBoardSize] = useState<number>(settings.boardSize);

  const handleSave = () => {
    onSave({
      depth,
      lines,
      showBestMoveArrow,
      boardSize
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1b2130] border border-[#2e374d] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#283247] mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            ENGINE SETTINGS
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Sliders */}
        <div className="space-y-6">
          {/* Depth */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-200">Depth</span>
              <span className="text-sm font-bold text-slate-300 font-mono">{depth}</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#2a344a] rounded-lg appearance-none cursor-pointer accent-[#e5a93c]"
            />
          </div>

          {/* Lines (Multi-PV) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-200">Lines</span>
              <span className="text-sm font-bold text-slate-300 font-mono">{lines} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={lines}
              onChange={(e) => setLines(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#2a344a] rounded-lg appearance-none cursor-pointer accent-[#e5a93c]"
            />
          </div>

          {/* Best-move arrows on the board toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              Best-move arrows on the board
            </span>
            <button
              onClick={() => setShowBestMoveArrow(!showBestMoveArrow)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                showBestMoveArrow ? 'bg-[#e5a93c]' : 'bg-[#374151]'
              }`}
            >
              <div
                className={`bg-[#131722] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  showBestMoveArrow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Board size */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-200">Preview board size</span>
              <span className="text-sm font-bold text-slate-300 font-mono">{boardSize}px</span>
            </div>
            <input
              type="range"
              min="440"
              max="740"
              step="20"
              value={boardSize}
              onChange={(e) => setBoardSize(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#2a344a] rounded-lg appearance-none cursor-pointer accent-[#e5a93c]"
            />
          </div>

          {/* Explanation note */}
          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            Depth bounds the analysis; click + to extend to infinite. Changing the number of lines restarts the engine.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#283247]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] rounded-lg transition shadow-md"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
