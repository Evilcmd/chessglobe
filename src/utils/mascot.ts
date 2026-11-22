import { Repertoire } from '../types';

export interface MascotInfo {
  id: number;
  src: string;
  name: string;
  title: string;
}

export const MASCOTS: MascotInfo[] = [
  { id: 1, src: '/mascots/mascot-1.svg', name: 'London Explorer', title: 'London & System Specialist' },
  { id: 2, src: '/mascots/mascot-2.svg', name: 'Knight Champion', title: 'Classical & Central Vanguard' },
  { id: 3, src: '/mascots/mascot-3.svg', name: 'Sicilian Night Owl', title: 'Tactical & Counterattack Ace' },
  { id: 4, src: '/mascots/mascot-4.svg', name: 'Royal King', title: 'Grand Monarch & King’s Indian Master' },
  { id: 5, src: '/mascots/mascot-5.svg', name: 'Grandmaster Wizard', title: 'Magical Combinations & Puzzles' },
  { id: 6, src: '/mascots/mascot-6.svg', name: 'Blitz Ninja', title: 'Speed & Sharp Tactics' },
  { id: 7, src: '/mascots/mascot-7.svg', name: 'Scholarly Professor', title: 'Deep Theory & Book Lines' },
  { id: 8, src: '/mascots/mascot-8.svg', name: 'Viking Berserker', title: 'Aggressive Gambits & Sacrifices' },
  { id: 9, src: '/mascots/mascot-9.svg', name: 'Detective Sherlock', title: 'Positional Mysteries & Prophylaxis' },
  { id: 10, src: '/mascots/mascot-10.svg', name: 'Cosmic Astronaut', title: 'Hypermodern & Deep Horizons' },
];

/**
 * Returns the mascot image path for a given repertoire.
 * Uses assigned mascotIndex (round robin % 10), card index, or deterministic ID hash fallback.
 */
export function getRepertoireMascot(repertoire?: Repertoire | null, index?: number): string {
  if (!repertoire) {
    return MASCOTS[0].src;
  }

  // 1. Explicit assigned round-robin index
  if (typeof repertoire.mascotIndex === 'number') {
    const idx = Math.abs(repertoire.mascotIndex) % MASCOTS.length;
    return MASCOTS[idx].src;
  }

  // 2. Positional index in list
  if (typeof index === 'number' && index >= 0) {
    return MASCOTS[index % MASCOTS.length].src;
  }

  // 3. Known preset ID mapping
  if (repertoire.id === 'rep-jobava-london') return MASCOTS[0].src;
  if (repertoire.id === 'rep-1d4') return MASCOTS[1].src;
  if (repertoire.id === 'rep-sicilian-kan') return MASCOTS[2].src;
  if (repertoire.id === 'rep-kings-indian') return MASCOTS[3].src;

  // 4. Deterministic hash of repertoire ID as fallback
  let hash = 0;
  const str = repertoire.id || repertoire.name || '';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return MASCOTS[Math.abs(hash) % MASCOTS.length].src;
}
