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
  },
  'operation-span': {
    title: 'Operation Span Task',
    description: 'Solve math problems while remembering words, then recall all words in order.',
    type: 'mixed',
    reverse: false,
    icon: 'calculator',
    color: 'red'
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
  
  // Strict exact match only - no tolerance for differences
  return userClean === correctClean;
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

// Operation Span Task functions
const WORDS = ["Apple", "Chair", "Tree", "Bottle", "Window", "Pencil", "Laptop", "Phone", "Bag", "Shoes", "Clock", "Mouse", "Camera", "Paper", "Flower", "Coffee", "Music", "Garden", "Bridge", "Ocean"];

export function generateMathQuestion(level: number): { question: string; answer: number } {
  let a: number, b: number, op: string, question: string, answer: number;

  if (level === 1) { // Easy
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    op = Math.random() < 0.5 ? '+' : '-';
    if (op === '-' && a < b) [a, b] = [b, a]; // Ensure positive result
    
    question = `${a} ${op} ${b}`;
    answer = op === '+' ? a + b : a - b;
  } else if (level === 2) { // Medium
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    op = Math.random() < 0.5 ? '*' : '/';
    
    if (op === '/') {
      // Generate division that results in whole numbers
      const dividend = a * b; // Make sure dividend is divisible by b
      question = `${dividend} ${op} ${b}`;
      answer = dividend / b; // This should equal a
    } else {
      question = `${a} ${op} ${b}`;
      answer = a * b;
    }
  } else { // Mixed
    a = Math.floor(Math.random() * 11) + 5;
    b = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    op = operations[Math.floor(Math.random() * operations.length)];
    
    if (op === '-' && a < b) [a, b] = [b, a];
    
    question = `${a} ${op} ${b}`;
    if (op === '+') {
      answer = a + b;
    } else if (op === '-') {
      answer = a - b;
    } else {
      answer = a * b;
    }
  }
  
  console.log('Generated math question:', { question, answer, a, b, op });
  return { question, answer };
}

export function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function validateMathAnswer(userAnswer: string, correctAnswer: number): boolean {
  const userNum = parseInt(userAnswer.trim());
  const isValid = !isNaN(userNum) && userNum === correctAnswer;
  
  console.log('validateMathAnswer:', {
    userAnswer: userAnswer.trim(),
    userNum,
    correctAnswer,
    isValid
  });
  
  return isValid;
}

export function validateWordRecall(userWords: string[], correctWords: string[]): number {
  console.log('DEBUG validateWordRecall INPUT:', {
    userWords,
    correctWords,
    userWordsLength: userWords.length,
    correctWordsLength: correctWords.length
  });
  
  // More aggressive cleaning - remove all extra spaces and convert to lowercase
  const userCleaned = userWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
  const correctCleaned = correctWords.map(w => w.trim().toLowerCase());
  
  console.log('DEBUG cleaned words:', {
    userCleaned,
    correctCleaned,
    userCleanedStringified: JSON.stringify(userCleaned),
    correctCleanedStringified: JSON.stringify(correctCleaned)
  });
  
  // Count how many words are correct in the right position
  let correctCount = 0;
  const minLength = Math.min(userCleaned.length, correctCleaned.length);
  
  // Detailed validation logging
  for (let i = 0; i < minLength; i++) {
    const userWord = userCleaned[i];
    const correctWord = correctCleaned[i];
    const match = userWord === correctWord;
    console.log(`DEBUG word ${i}: "${userWord}" (${userWord.length}) vs "${correctWord}" (${correctWord.length}) = ${match}`);
    
    // Check for hidden characters
    if (!match) {
      console.log('DEBUG non-match details:', {
        userCharCodes: Array.from(userWord).map(c => c.charCodeAt(0)),
        correctCharCodes: Array.from(correctWord).map(c => c.charCodeAt(0)),
        userChars: Array.from(userWord),
        correctChars: Array.from(correctWord)
      });
    }
    
    if (match) {
      correctCount++;
    }
  }
  
  // Check if user provided too many or too few words
  if (userCleaned.length !== correctCleaned.length) {
    console.log('DEBUG length mismatch - user provided', userCleaned.length, 'expected', correctCleaned.length);
  }
  
  console.log('DEBUG validation result:', {
    correctCount,
    minLength,
    totalExpected: correctCleaned.length,
    perfectMatch: correctCount === correctCleaned.length && userCleaned.length === correctCleaned.length
  });
  
  // For Operation Span Task, we need all words to be correct in order AND the right number of words
  const isComplete = correctCount === correctCleaned.length && userCleaned.length === correctCleaned.length;
  console.log('DEBUG final result:', { isComplete, returning: isComplete ? correctCleaned.length : 0 });
  return isComplete ? correctCleaned.length : 0;
}


