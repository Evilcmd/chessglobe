import React, { useState, useMemo } from 'react';
import { X, Upload, Sparkles, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parsePgnToLines } from '../../utils/pgnParser';
import { Repertoire } from '../../types';
import { MASCOTS } from '../../utils/mascot';
import {
  JOBAVA_LONDON_PGN,
  D4_REPERTOIRE_PGN,
  SICILIAN_KAN_PGN,
  KINGS_INDIAN_PGN
} from '../../utils/presets';

interface NewRepertoireModalProps {
  onClose: () => void;
  onCreate: (rep: Omit<Repertoire, 'id' | 'createdAt'>) => void;
  defaultMascotIndex?: number;
}

const PRESET_OPENINGS = [
  {
    name: 'Jobava London System',
    color: 'white' as const,
    linesCount: '23 lines',
    pgn: JOBAVA_LONDON_PGN
  },
  {
    name: '1d4 Repertoire',
    color: 'white' as const,
    linesCount: '38 lines',
    pgn: D4_REPERTOIRE_PGN
  },
  {
    name: 'Sicilian Kan',
    color: 'black' as const,
    linesCount: '50 lines',
    pgn: SICILIAN_KAN_PGN
  },
  {
    name: "King's Indian Defense",
    color: 'black' as const,
    linesCount: '86 lines',
    pgn: KINGS_INDIAN_PGN
  }
];

export const NewRepertoireModal: React.FC<NewRepertoireModalProps> = ({
  onClose,
  onCreate,
  defaultMascotIndex = 0
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<'white' | 'black'>('white');
  const [selectedMascotIndex, setSelectedMascotIndex] = useState<number>(defaultMascotIndex % 10);
  const [activeTab, setActiveTab] = useState<'paste' | 'preset' | 'file'>('paste');
  const [pgnText, setPgnText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live PGN parse preview
  const parsedPreview = useMemo(() => {
    if (!pgnText.trim()) return null;
    try {
      const lines = parsePgnToLines(pgnText, name || 'Opening');
      return lines;
    } catch (e) {
      return null;
    }
  }, [pgnText, name]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPgnText(content);
        if (!name) {
          setName(file.name.replace(/\.pgn$/i, ''));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_OPENINGS[0]) => {
    setName(preset.name);
    setColor(preset.color);
    setPgnText(preset.pgn);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a name for the repertoire.');
      return;
    }

    if (!pgnText.trim()) {
      setErrorMsg('Please paste or upload a PGN file.');
      return;
    }

    const lines = parsePgnToLines(pgnText, name.trim());
    if (lines.length === 0) {
      setErrorMsg('No valid chess moves found in the PGN. Please check your PGN format.');
      return;
    }

    onCreate({
      name: name.trim(),
      color,
      pgn: pgnText.trim(),
      mascotIndex: selectedMascotIndex,
      lines
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#181d2a] border border-[#2b3347] rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242b3c]">
          <div>
            <h2 className="text-lg font-bold text-white">New repertoire</h2>
            <p className="text-xs text-slate-400">
              Create a new repertoire from scratch or import PGN.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#252c3e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Banner Promo (Image 2 style) */}
          <div className="bg-[#1e2434] border border-[#2d374d] rounded-xl p-3.5 flex items-center space-x-3 text-xs text-slate-300">
            <span className="p-2 rounded-lg bg-[#e5a93c]/15 text-[#e5a93c]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <strong className="text-white block font-semibold">
                Import from PGN or Games
              </strong>
              <span className="text-slate-400 text-[11px]">
                Pastes full trees and automatically breaks variations into distinct lines!
              </span>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Name
            </label>
            <input
              type="text"
              placeholder="e.g., My Sicilian Repertoire"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-[#141824] border border-[#2a3449] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e5a93c] transition"
            />
          </div>

          {/* Type Selector (Radio Buttons matching Image 2) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Type
            </label>
            <div className="flex items-center space-x-2 bg-[#141824] p-1.5 rounded-xl border border-[#2a3449]">
              <button
                type="button"
                onClick={() => setColor('white')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
                  color === 'white'
                    ? 'bg-[#252c3e] text-white shadow-sm border border-[#39445e]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className={`w-3 h-3 rounded-full border ${color === 'white' ? 'bg-white border-white' : 'border-slate-500'}`} />
                <span>White repertoire</span>
              </button>

              <button
                type="button"
                onClick={() => setColor('black')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
                  color === 'black'
                    ? 'bg-[#252c3e] text-white shadow-sm border border-[#39445e]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className={`w-3 h-3 rounded-full border ${color === 'black' ? 'bg-slate-400 border-slate-400' : 'border-slate-500'}`} />
                <span>Black repertoire</span>
              </button>
            </div>
          </div>

          {/* Opening Mascot Selection (10 round-robin mascots) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Opening Mascot
              </label>
              <span className="text-[11px] text-[#e5a93c] font-medium">
                #{selectedMascotIndex + 1}: {MASCOTS[selectedMascotIndex].name}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-[#141824] border border-[#2a3449] rounded-xl">
              {MASCOTS.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMascotIndex(idx)}
                  title={`${m.name} (${m.title})`}
                  className={`p-1 rounded-lg border transition flex flex-col items-center cursor-pointer ${
                    selectedMascotIndex === idx
                      ? 'bg-[#e5a93c]/20 border-[#e5a93c] ring-1 ring-[#e5a93c]'
                      : 'bg-[#1b2233] border-[#293347] hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={m.src} alt={m.name} className="w-7 h-7 object-contain pointer-events-none" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Auto-assigned in round-robin sequence (circles back every 10 openings). Click any mascot to customize.
            </p>
          </div>

          {/* PGN Tabs (Paste / Presets / File) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                PGN Data
              </label>
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'paste'
                      ? 'bg-[#2a3449] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paste PGN
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preset')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'preset'
                      ? 'bg-[#2a3449] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'file'
                      ? 'bg-[#2a3449] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* Paste Tab */}
            {activeTab === 'paste' && (
              <div>
                <textarea
                  rows={6}
                  placeholder={`Paste one or more PGN games with variations e.g.:\n1. d4 d5 (1... Nf6 2. c4) 2. c4 e6 ...`}
                  value={pgnText}
                  onChange={(e) => {
                    setPgnText(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-[#141824] border border-[#2a3449] rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e5a93c] transition"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Each variation branch and game automatically extracts into an independent training line.
                </span>
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'preset' && (
              <div className="space-y-2">
                {PRESET_OPENINGS.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPreset(p)}
                    className="p-3.5 rounded-xl bg-[#141824] border border-[#2a3449] hover:border-[#e5a93c] cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      <span className="text-[11px] text-slate-400 uppercase font-mono">
                        {p.color} repertoire • {p.linesCount}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#e5a93c] bg-[#e5a93c]/10 px-2.5 py-1 rounded-lg">
                      Use Preset
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* File Upload Tab */}
            {activeTab === 'file' && (
              <label className="border-2 border-dashed border-[#2b354d] hover:border-[#e5a93c] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-[#141824]">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  Click to upload .pgn file
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Standard Chess PGN format
                </span>
                <input
                  type="file"
                  accept=".pgn,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Live Parsing Preview */}
          {parsedPreview && parsedPreview.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Found <strong>{parsedPreview.length} playable lines</strong> ({parsedPreview.reduce((acc, l) => acc + l.moves.length, 0)} total moves). Ready to learn!
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#242b3c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#e5a93c] hover:bg-[#f59e0b] rounded-xl shadow-lg transition"
            >
              Create Repertoire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
