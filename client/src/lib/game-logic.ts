import { GameMode, GameState, ModeConfig } from "@shared/schema";

export const MODES: Record<GameMode, ModeConfig> = {
  'ds-forward': {
    title: 'Digit Span - Forward',
    description: 'Remember and repeat sequences of digits in the same order they were presented.',
    type: 'digit',
    reverse: false,
    icon: 'arrow-right',
    color: 'blue'
  },
  'ds-backward': {
    title: 'Digit Span - Backward',
    description: 'Remember sequences of digits and repeat them in reverse order.',
    type: 'digit',
    reverse: true,
    icon: 'arrow-left',
    color: 'purple'
  },
  'spatial-forward': {
    title: 'Spatial Span - Forward',
    description: 'Remember sequences of letters and type them in the same order.',
    type: 'letter',
    reverse: false,
    icon: 'grid-3x3',
    color: 'green'
  },
  'spatial-backward': {
    title: 'Spatial Span - Backward',
    description: 'Remember sequences of letters and type them in reverse order.',
    type: 'letter',
    reverse: true,
    icon: 'grid-2x2',
    color: 'orange'
  }
};

export function generateDigitSequence(length: number): number[] {
  const sequence: number[] = [];
  const available = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    sequence.push(available.splice(randomIndex, 1)[0]);
  }
  
  return sequence;
}

export function generateLetterSequence(length: number): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const sequence: string[] = [];
  const available = letters.split('');
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    sequence.push(available.splice(randomIndex, 1)[0]);
  }
  
  return sequence;
}

export function generateSequence(mode: GameMode, length: number): (string | number)[] {
  const config = MODES[mode];
  if (config.type === 'digit') {
    return generateDigitSequence(length);
  } else {
    return generateLetterSequence(length);
  }
}

export function getCorrectAnswer(sequence: (string | number)[], reverse: boolean): string {
  const result = reverse ? [...sequence].reverse() : sequence;
  return result.join('');
}

export function validateAnswer(userInput: string, correctAnswer: string): boolean {
  const userClean = userInput.toLowerCase().trim().replace(/\s+/g, '');
  const correctClean = correctAnswer.toLowerCase().trim().replace(/\s+/g, '');
  
  // Exact match
  if (userClean === correctClean) {
    return true;
  }
  
  // For sequences of same length, allow minor differences
  if (userClean.length === correctClean.length) {
    let differences = 0;
    for (let i = 0; i < userClean.length; i++) {
      if (userClean[i] !== correctClean[i]) {
        differences++;
      }
    }
    
    // Allow 1 character difference for sequences of 4+ characters
    // This handles cases like typing 'O' instead of '0' or similar mistakes
    if (correctClean.length >= 4 && differences === 1) {
      return true;
    }
    
    // For shorter sequences, be more strict
    if (correctClean.length <= 3 && differences === 0) {
      return true;
    }
  }
  
  // For different lengths, check if user just missed/added one character
  if (Math.abs(userClean.length - correctClean.length) === 1) {
    const shorter = userClean.length < correctClean.length ? userClean : correctClean;
    const longer = userClean.length < correctClean.length ? correctClean : userClean;
    
    // Check if shorter string is contained in longer string with 1 insertion
    for (let i = 0; i <= longer.length - shorter.length; i++) {
      let matches = 0;
      for (let j = 0; j < shorter.length; j++) {
        if (shorter[j] === longer[i + j]) {
          matches++;
        }
      }
      if (matches >= shorter.length - 1) {
        return true;
      }
    }
  }
  
  return false;
}

export function calculateScore(level: number, timeRemaining: number): number {
  const baseScore = level * 50;
  const timeBonus = Math.floor(timeRemaining * 2);
  return baseScore + timeBonus;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
