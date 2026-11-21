import { Repertoire } from '../types';
import { parsePgnToLines } from './pgnParser';

const jobavaLondonPgn = `
[Event "Jobava London - Main Line with 3...c5"]
1. d4 {Hey folks, I'm excited to invite you to learn the Jobava London! Although I am mostly known for opening with knight to c3, in my earlier years I was a little more conservative and played this opening instead. Especially in blitz, it felt like a cheat code, and many have fallen for its tricky traps. So, why did I ever stop playing it? I still can't answer!} d5 2. Nc3 {The signature knight move of the Jobava! Developing immediately and putting pressure on e4.} Nf6 3. Bf4 {Developing the dark-squared bishop outside the pawn chain before playing e3.} c5 4. e3 {Solidifying the center and opening lines for our light-squared bishop.} cxd4 (4... a6 5. dxc5 Nc6 6. Nf3 {Controlling e5}) 5. exd4 a6 6. Nf3 Bg4 7. h3 Bxf3 8. Qxf3 Nc6 9. O-O-O {Queenside castling allows our rook to support an aggressive kingside storm!} *

[Event "Jobava London - 3...e6 Solid Setup"]
1. d4 d5 2. Nc3 Nf6 3. Bf4 e6 4. e3 Bd6 5. Nf3 O-O 6. Bd3 c5 7. dxc5 Bxc5 8. O-O Nc6 9. e4 {Striking in the center with dynamic piece play!} *

[Event "Jobava London - vs 1...Nf6 & King's Indian"]
1. d4 Nf6 2. Nc3 d5 (2... g6 3. e4 d6 4. f4 Bg7 5. Nf3 O-O {Aggressive 150 Attack style against King's Indian!}) 3. Bf4 c6 4. e3 Bf5 5. f3 {Preparing e4 with a massive pawn center!} e6 6. g4 Bg6 7. h4 h6 8. Bd3 *

[Event "Jobava London - vs French Defense Move Order"]
1. d4 e6 2. Nc3 d5 3. Bf4 c5 4. e3 Nc6 5. Nb5 {Classic Jobava tactical jump threatening Nc7+ winning the rook!} e5 6. dxe5 Be6 7. Nf3 *

[Event "Jobava London - vs Caro-Kann Defense"]
1. d4 d5 2. Nc3 c6 3. Bf4 Bf5 4. e3 e6 5. g4 {Kicking Black's active bishop and seizing space immediately!} Bg6 6. h4 h5 7. g5 Bd6 8. Nh3 *
`;

const sicilianKanPgn = `
[Event "Sicilian Kan - Main Line 5. Nc3 Qc7"]
1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 {The defining move of the Kan: prevents Nb5 and prepares ...b5 space expansion.} 5. Nc3 Qc7 6. Bd3 Nf6 7. O-O Bc5 {Active piece play targeting the d4 knight!} 8. Nb3 Be7 9. f4 d6 *

[Event "Sicilian Kan - 5. Bd3 g6 Setup"]
1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Bc5 6. Nb3 Ba7 {A fabulous diagonal for the dark-squared bishop eyeing f2!} 7. O-O Nc6 8. Qe2 d6 9. Be3 Nf6 *

[Event "Sicilian Kan - Maroczy Bind 5. c4"]
1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. c4 Nf6 6. Nc3 Bb4 {Pinning White's knight and undermining e4!} 7. Bd3 Nc6 8. Nxc6 dxc6 9. O-O e5 {Cementing control over d4!} *

[Event "Sicilian Kan - vs Alapin 2. c3"]
1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 e6 6. Be2 cxd4 7. cxd4 Nc6 8. Nc3 Qd6 {Safe blockading square for the Queen.} *
`;

export function getInitialPresets(): Repertoire[] {
  const jobavaLines = parsePgnToLines(jobavaLondonPgn, 'Jobava London');
  // Mark a couple as learned/trained for realistic initial preview
  if (jobavaLines[0]) {
    jobavaLines[0].learned = true;
    jobavaLines[0].trained = true;
  }
  if (jobavaLines[1]) {
    jobavaLines[1].learned = true;
  }

  const kanLines = parsePgnToLines(sicilianKanPgn, 'Sicilian Kan');

  return [
    {
      id: 'rep-jobava-london',
      name: 'Jobava London System',
      color: 'white',
      pgn: jobavaLondonPgn.trim(),
      coverId: 'london',
      lines: jobavaLines,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'rep-sicilian-kan',
      name: 'Sicilian Kan',
      color: 'black',
      pgn: sicilianKanPgn.trim(),
      coverId: 'kan',
      lines: kanLines,
      createdAt: Date.now() - 86400000 * 1,
    }
  ];
}
