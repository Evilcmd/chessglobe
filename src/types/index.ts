export interface MoveItem {
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  piece: string;
  captured?: string;
  fen: string;
  comment?: string;
}

export interface RepertoireLine {
  id: string;
  name: string;
  moves: MoveItem[];
  keyMovesSummary: string;
  learned: boolean;
  trained: boolean;
  mistakeCount: number;
  lastPracticed?: number;
}

export interface Repertoire {
  id: string;
  name: string;
  color: 'white' | 'black';
  pgn: string;
  coverId?: string; // mascot avatar style
  mascotIndex?: number;
  lines: RepertoireLine[];
  createdAt: number;
  archived?: boolean;
}

export interface EngineSettings {
  depth: number;
  lines: number;
  showBestMoveArrow: boolean;
  boardSize: number;
}
