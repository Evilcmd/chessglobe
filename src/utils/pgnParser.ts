import { Chess } from 'chess.js';
import { RepertoireLine, MoveItem } from '../types';

export function parsePgnToLines(pgn: string, repertoireName: string = 'Opening'): RepertoireLine[] {
  // First, extract individual games if multiple games exist
  const gameStrings: string[] = [];
  const linesRaw = pgn.trim().split(/\r?\n/);
  let currentGame: string[] = [];

  for (const line of linesRaw) {
    if (line.trim().startsWith('[Event ') && currentGame.length > 0) {
      gameStrings.push(currentGame.join('\n'));
      currentGame = [line];
    } else {
      currentGame.push(line);
    }
  }
  if (currentGame.length > 0) {
    gameStrings.push(currentGame.join('\n'));
  }

  const allExtractedLines: RepertoireLine[] = [];

  for (let gIdx = 0; gIdx < gameStrings.length; gIdx++) {
    const rawGame = gameStrings[gIdx];

    // Extract headers
    let eventName = '';
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match: RegExpExecArray | null;
    while ((match = headerRegex.exec(rawGame)) !== null) {
      if (match[1] === 'Event' && match[2] && match[2] !== '?') {
        eventName = match[2];
      }
    }

    // Strip comments, tags, nags
    // Tokenize correctly
    const tokens: Array<{ type: 'san' | 'comment' | '(' | ')'; value?: string }> = [];
    let i = 0;
    while (i < rawGame.length) {
      const char = rawGame[i];

      // Skip bracketed headers [ ... ]
      if (char === '[') {
        const closeBracket = rawGame.indexOf(']', i);
        i = closeBracket !== -1 ? closeBracket + 1 : rawGame.length;
        continue;
      }

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Variation parentheses
      if (char === '(' || char === ')') {
        tokens.push({ type: char });
        i++;
        continue;
      }

      // Curly brace comments
      if (char === '{') {
        const closeBrace = rawGame.indexOf('}', i);
        if (closeBrace !== -1) {
          const commentText = rawGame.substring(i + 1, closeBrace).trim();
          tokens.push({ type: 'comment', value: commentText });
          i = closeBrace + 1;
        } else {
          i++;
        }
        continue;
      }

      // Semicolon comments
      if (char === ';') {
        const newline = rawGame.indexOf('\n', i);
        const commentText = (newline !== -1 ? rawGame.substring(i + 1, newline) : rawGame.substring(i + 1)).trim();
        tokens.push({ type: 'comment', value: commentText });
        i = newline !== -1 ? newline + 1 : rawGame.length;
        continue;
      }

      // NAGs like $1, $14, etc.
      if (char === '$') {
        let j = i + 1;
        while (j < rawGame.length && /\d/.test(rawGame[j])) j++;
        i = j;
        continue;
      }

      // Read SAN / move text
      let j = i;
      while (j < rawGame.length && !/[\s(){}\[\];]/.test(rawGame[j])) j++;
      const word = rawGame.substring(i, j);
      i = j;

      // Skip move numbers like "1." or "1..." or "12."
      if (/^\d+\.+$/.test(word)) {
        continue;
      }

      // Clean move word: strip leading move number (e.g. "1.e4" -> "e4" or "1...c5" -> "c5")
      // and strip evaluation annotations like !, ?, !?, ?!
      const moveMatch = word.match(/^(\d+\.+)?([a-zA-Z0-9+=#-]+)/);
      if (moveMatch && moveMatch[2]) {
        const san = moveMatch[2];
        if (san !== '*' && san !== '1-0' && san !== '0-1' && san !== '1/2-1/2') {
          tokens.push({ type: 'san', value: san });
        }
      }
    }

    // Build the variation tree
    interface Node {
      san: string;
      comment: string;
      parent: Node | null;
      children: Node[];
    }

    const root: Node = { san: '', comment: '', parent: null, children: [] };
    let currentNode: Node = root;
    const variationStack: Node[] = [];

    for (const token of tokens) {
      if (token.type === 'san') {
        const newNode: Node = {
          san: token.value!,
          comment: '',
          parent: currentNode,
          children: []
        };
        currentNode.children.push(newNode);
        currentNode = newNode;
      } else if (token.type === 'comment') {
        if (currentNode) {
          currentNode.comment = currentNode.comment
            ? `${currentNode.comment}\n${token.value}`
            : token.value!;
        }
      } else if (token.type === '(') {
        if (currentNode && currentNode.parent) {
          variationStack.push(currentNode);
          currentNode = currentNode.parent; // Branch off from the parent position
        }
      } else if (token.type === ')') {
        if (variationStack.length > 0) {
          currentNode = variationStack.pop()!;
        }
      }
    }

    // Extract all paths from root to leaves
    const paths: Node[][] = [];
    function collectLeaves(node: Node, currentPath: Node[]) {
      const newPath = node.san ? [...currentPath, node] : currentPath;
      if (node.children.length === 0) {
        if (newPath.length > 0) {
          paths.push(newPath);
        }
        return;
      }
      for (const child of node.children) {
        collectLeaves(child, newPath);
      }
    }

    collectLeaves(root, []);

    // Validate each path through chess.js to guarantee 100% legal moves & collect FENs
    for (let pIdx = 0; pIdx < paths.length; pIdx++) {
      const rawNodes = paths[pIdx];
      const chess = new Chess();
      const verifiedMoves: MoveItem[] = [];
      let valid = true;

      for (const node of rawNodes) {
        try {
          const moveRes = chess.move(node.san);
          if (!moveRes) {
            valid = false;
            break;
          }
          verifiedMoves.push({
            san: moveRes.san,
            from: moveRes.from,
            to: moveRes.to,
            color: moveRes.color,
            piece: moveRes.piece,
            captured: moveRes.captured,
            fen: chess.fen(),
            comment: node.comment || undefined
          });
        } catch (e) {
          valid = false;
          break;
        }
      }

      if (valid && verifiedMoves.length > 0) {
        // Generate a friendly name for this line
        const lineNum = allExtractedLines.length + 1;
        const keyMovesSummary = verifiedMoves.slice(0, 6).map((m, idx) => {
          const moveNumber = Math.floor(idx / 2) + 1;
          const isWhite = idx % 2 === 0;
          return isWhite ? `${moveNumber}. ${m.san}` : m.san;
        }).join(' ');

        // Try to derive a meaningful sub-line title
        let lineTitle = '';
        if (eventName) {
          lineTitle = paths.length > 1 ? `${eventName} - Line ${pIdx + 1}` : eventName;
        } else {
          // Check if there's a comment in the first few moves that can serve as name
          const firstCommentMove = verifiedMoves.find(m => m.comment && m.comment.length < 50);
          if (firstCommentMove && firstCommentMove.comment) {
            lineTitle = firstCommentMove.comment.split('\n')[0];
          } else {
            lineTitle = `Line ${lineNum}: ${verifiedMoves.slice(0, 4).map(m => m.san).join(' ')}`;
          }
        }

        allExtractedLines.push({
          id: `line-${lineNum}-${Date.now()}`,
          name: lineTitle,
          moves: verifiedMoves,
          keyMovesSummary,
          learned: false,
          trained: false,
          mistakeCount: 0
        });
      }
    }
  }

  return allExtractedLines;
}
