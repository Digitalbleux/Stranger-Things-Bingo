import { BingoCellData, BINGO_PROMPTS, WinMode } from '../constants';

export const generateBingoCard = (): BingoCellData[] => {
  // Shuffle prompts
  const shuffled = [...BINGO_PROMPTS].sort(() => 0.5 - Math.random());
  
  // Select first 24
  const selected = shuffled.slice(0, 24);
  
  // Insert Free Space at index 12 (center of 5x5 grid)
  const card: BingoCellData[] = [
    ...selected.slice(0, 12).map((text, i) => ({ id: `cell-${i}`, text })),
    { id: 'free-space', text: "FREE SPACE", isFreeSpace: true },
    ...selected.slice(12).map((text, i) => ({ id: `cell-${i+12}`, text }))
  ];
  
  return card;
};

export const checkWin = (markedIndices: number[], mode: WinMode): boolean => {
  const size = 5;
  const markedSet = new Set(markedIndices);

  const checkLine = (indices: number[]) => indices.every(i => markedSet.has(i));

  // Rows
  const rows = Array.from({ length: size }, (_, r) => 
    Array.from({ length: size }, (_, c) => r * size + c)
  );

  // Columns
  const cols = Array.from({ length: size }, (_, c) => 
    Array.from({ length: size }, (_, r) => r * size + c)
  );

  // Diagonals
  const diag1 = [0, 6, 12, 18, 24];
  const diag2 = [4, 8, 12, 16, 20];

  const hasRow = rows.some(checkLine);
  const hasCol = cols.some(checkLine);
  const hasDiag = checkLine(diag1) || checkLine(diag2);
  const hasX = checkLine(diag1) && checkLine(diag2);
  const hasBlackout = markedIndices.length === 25;

  switch (mode) {
    case 'HORIZONTAL': return hasRow;
    case 'VERTICAL': return hasCol;
    case 'DIAGONAL': return hasDiag;
    case 'X': return hasX;
    case 'BLACKOUT': return hasBlackout;
    case 'STANDARD': 
    default:
      return hasRow || hasCol || hasDiag;
  }
};