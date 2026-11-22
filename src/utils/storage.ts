import { Repertoire, EngineSettings } from '../types';
import { getInitialPresets } from './presets';

const STORAGE_KEY = 'chessglobe_repertoires_v1';
const SETTINGS_KEY = 'chessglobe_engine_settings_v1';

export function loadRepertoires(): Repertoire[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from any legacy key if present
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('repertoires') && k !== STORAGE_KEY) {
          raw = localStorage.getItem(k);
          if (raw) {
            localStorage.setItem(STORAGE_KEY, raw);
            break;
          }
        }
      }
    }

    if (!raw) {
      const presets = getInitialPresets();
      saveRepertoires(presets);
      return presets;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all repertoires have mascotIndex assigned round-robin
      let modified = false;
      const updated = parsed.map((rep: Repertoire, idx: number) => {
        if (typeof rep.mascotIndex !== 'number') {
          modified = true;
          return { ...rep, mascotIndex: idx % 10 };
        }
        return rep;
      });
      if (modified) {
        saveRepertoires(updated);
      }
      return updated;
    }
    const presets = getInitialPresets();
    saveRepertoires(presets);
    return presets;
  } catch (e) {
    console.error('Failed to load repertoires:', e);
    return getInitialPresets();
  }
}

export function restoreDefaultPresets(): Repertoire[] {
  const current = loadRepertoires();
  const presets = getInitialPresets();

  const existingIds = new Set(current.map(r => r.id));
  const existingNames = new Set(current.map(r => r.name.toLowerCase().trim()));

  // Only bring back default presets that were deleted / missing
  const missingPresets = presets.filter(
    preset => !existingIds.has(preset.id) && !existingNames.has(preset.name.toLowerCase().trim())
  );

  if (missingPresets.length === 0) {
    return current;
  }

  // Append missing default presets without touching any existing openings or resetting progress
  const updated = [...current, ...missingPresets];
  saveRepertoires(updated);
  return updated;
}

export function saveRepertoires(repertoires: Repertoire[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repertoires));
  } catch (e) {
    console.error('Failed to save repertoires:', e);
  }
}

export function getRepertoireById(id: string): Repertoire | undefined {
  const all = loadRepertoires();
  return all.find(r => r.id === id);
}

export function createRepertoire(item: Omit<Repertoire, 'id' | 'createdAt'>): Repertoire {
  const all = loadRepertoires();
  // Round-robin mascot index based on current total openings count
  const mascotIndex = item.mascotIndex ?? (all.length % 10);
  const newRep: Repertoire = {
    ...item,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    mascotIndex,
    createdAt: Date.now()
  };
  all.unshift(newRep);
  saveRepertoires(all);
  return newRep;
}

export function deleteRepertoire(id: string): void {
  const all = loadRepertoires();
  const filtered = all.filter(r => r.id !== id);
  saveRepertoires(filtered);
}

export function updateLineStatus(
  repId: string,
  lineId: string,
  updates: { learned?: boolean; trained?: boolean; mistake?: boolean }
): void {
  const all = loadRepertoires();
  const rep = all.find(r => r.id === repId);
  if (!rep) return;

  const line = rep.lines.find(l => l.id === lineId);
  if (!line) return;

  if (updates.learned !== undefined) {
    line.learned = updates.learned;
  }
  if (updates.trained !== undefined) {
    line.trained = updates.trained;
  }
  if (updates.mistake) {
    line.mistakeCount = (line.mistakeCount || 0) + 1;
    line.trained = false; // mistake keeps it in training rotation
  }
  line.lastPracticed = Date.now();

  saveRepertoires(all);
}

// User requirement: independently reset learning or training
export function resetLearningProgress(repId: string): void {
  const all = loadRepertoires();
  const rep = all.find(r => r.id === repId);
  if (!rep) return;

  rep.lines.forEach(line => {
    line.learned = false;
  });
  saveRepertoires(all);
}

export function resetTrainingProgress(repId: string): void {
  const all = loadRepertoires();
  const rep = all.find(r => r.id === repId);
  if (!rep) return;

  rep.lines.forEach(line => {
    line.trained = false;
    line.mistakeCount = 0;
  });
  saveRepertoires(all);
}

export function loadEngineSettings(): EngineSettings {
  const defaults: EngineSettings = {
    depth: 22,
    lines: 3,
    showBestMoveArrow: true,
    boardSize: 560
  };
  if (typeof window === 'undefined') return defaults;
  try {
    let raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('engine_settings') && k !== SETTINGS_KEY) {
          raw = localStorage.getItem(k);
          if (raw) {
            localStorage.setItem(SETTINGS_KEY, raw);
            break;
          }
        }
      }
    }
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch (_) {
    return defaults;
  }
}

export function saveEngineSettings(settings: EngineSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}
