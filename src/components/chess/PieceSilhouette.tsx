import React from 'react';

// Crisp, vector-precise cburnett piece silhouettes matching Lichess style
// fill="currentColor" allows styling via Tailwind (e.g. text-slate-300 hover:text-white)
// stroke="#161c28" separates overlapping pieces cleanly against the dark tray
export const PieceSilhouettes: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  // Pawn silhouette
  P: (props) => (
    <svg viewBox="0 0 45 45" fill="currentColor" stroke="#161c28" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      />
    </svg>
  ),

  // Knight silhouette
  N: (props) => (
    <svg viewBox="0 0 45 45" fill="currentColor" stroke="#161c28" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 16.5,23 16,21 14,14 10,15 9,10 11,8 14,12 16,11 18,10 20,8 22,10 z"
      />
      <path
        d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 -0.73,-0.994 -0.5,-2 -0.5,-3 1,-1 3,2.5 3,2.5 z"
      />
      <circle cx="14" cy="15.5" r="1.3" fill="#161c28" stroke="none" />
    </svg>
  ),

  // Bishop silhouette
  B: (props) => (
    <svg viewBox="0 0 45 45" fill="currentColor" stroke="#161c28" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.49 -10.11,-0.96 -13.5,1 -3.39,-1.96 -10.11,-1.49 -13.5,-1 -1.35,0.49 -2.32,0.47 -3,-0.5 1.35,-1.46 3,-2 3,-2 z"
      />
      <path
        d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"
      />
      <path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" />
      <path d="m 17.5,26 h 10 M 15,30 h 15 M 22.5,15.5 v 5 M 20,18 h 5" fill="none" stroke="#161c28" strokeWidth="1.6" strokeLinejoin="miter" />
    </svg>
  ),

  // Rook silhouette
  R: (props) => (
    <svg viewBox="0 0 45 45" fill="currentColor" stroke="#161c28" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="m 9,39 h 27 v -3 h -3 v -2 h 1 c 1,0 1,-1 1,-1 v -2.5 c 0,-1.5 -1.5,-2.5 -3,-2.5 H 14 c -1.5,0 -3,1 -3,2.5 V 33 c 0,0 0,1 1,1 h 1 v 2 H 9 z"
      />
      <path
        d="m 12,33.5 h 21 v -19 l -2,-3 h -1.5 v 3 h -3 v -3 h -3 v 3 h -3 v -3 h -3 v 3 h -3 v -3 H 14 l -2,3 z"
      />
      <path d="m 14,29.5 h 17 M 14,16.5 h 17" fill="none" stroke="#161c28" strokeWidth="1.4" />
    </svg>
  ),

  // Queen silhouette
  Q: (props) => (
    <svg viewBox="0 0 45 45" fill="currentColor" stroke="#161c28" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m 8,12 a 2,2 0 1 1 -4,0 2,2 0 1 1 4,0 z m 9.5,-4.5 a 2,2 0 1 1 -4,0 2,2 0 1 1 4,0 z m 11.5,0 a 2,2 0 1 1 -4,0 2,2 0 1 1 4,0 z m 11.5,4.5 a 2,2 0 1 1 -4,0 2,2 0 1 1 4,0 z M 24.5,6 a 2,2 0 1 1 -4,0 2,2 0 1 1 4,0 z" />
      <path
        d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -7,-16 -7,16 -7,-11 z"
      />
      <path
        d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 0,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z"
      />
      <path d="m 11.5,30 c 3.5,-1 18.5,-1 22,0 M 12,33.5 c 6,-1 15,-1 21,0" fill="none" stroke="#161c28" strokeWidth="1.4" />
    </svg>
  )
};
