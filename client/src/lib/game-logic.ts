import { GameMode, GameState, ModeConfig, WCSTCard } from "@shared/schema";

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
  },
  'wcst': {
    title: 'Wisconsin Card Sorting Test',
    description: 'Test your cognitive flexibility by matching cards according to hidden rules.',
    type: 'mixed',
    reverse: false,
    icon: 'layers',
    color: 'purple'
  },
  'digit-cancellation': {
    title: 'Digit Cancellation Task',
    description: 'Test your sustained attention by quickly identifying and marking target digits.',
    type: 'mixed',
    reverse: false,
    icon: 'target',
    color: 'blue'
  },
  'tmt-a': {
    title: 'Trail Making Test A',
    description: 'Connect numbers 1-25 in ascending order as quickly as possible.',
    type: 'mixed',
    reverse: false,
    icon: 'target',
    color: 'blue'
  },
  'tmt-b': {
    title: 'Trail Making Test B',
    description: 'Alternate between numbers and letters in sequence (1-A-2-B-3-C...).',
    type: 'mixed',
    reverse: false,
    icon: 'rotate-ccw',
    color: 'purple'
  },
  'stroop-color': {
    title: 'Stroop Color Game',
    description: 'Test your attention control by identifying colors while ignoring word meanings.',
    type: 'mixed',
    reverse: false,
    icon: 'palette',
    color: 'rainbow'
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

  if (level === 1) { // Easy - Simple addition and subtraction
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    op = Math.random() < 0.5 ? '+' : '-';
    if (op === '-' && a < b) [a, b] = [b, a]; // Ensure positive result
    
    question = `${a} ${op} ${b}`;
    answer = op === '+' ? a + b : a - b;
  } else if (level === 2) { // Medium - Simple multiplication (2-5 range)
    a = Math.floor(Math.random() * 4) + 2; // 2 to 5
    b = Math.floor(Math.random() * 4) + 2; // 2 to 5
    op = '*';
    
    question = `${a} ${op} ${b}`;
    answer = a * b; // Max will be 5*5=25
  } else { // Mixed - All operations but keep numbers small
    const operations = ['+', '-', '*'];
    op = operations[Math.floor(Math.random() * operations.length)];
    
    if (op === '*') {
      // Keep multiplication simple
      a = Math.floor(Math.random() * 4) + 2; // 2 to 5
      b = Math.floor(Math.random() * 4) + 2; // 2 to 5
    } else {
      // Addition and subtraction use 1-10
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      if (op === '-' && a < b) [a, b] = [b, a];
    }
    
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

// Wisconsin Card Sorting Test Logic
export function createWCSTDeck(): WCSTCard[] {
  const colors: ('Red' | 'Green' | 'Blue' | 'Yellow')[] = ['Red', 'Green', 'Blue', 'Yellow'];
  const shapes: ('Circle' | 'Triangle' | 'Star' | 'Square')[] = ['Circle', 'Triangle', 'Star', 'Square'];
  const numbers: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
  
  const deck: WCSTCard[] = [];
  for (const color of colors) {
    for (const shape of shapes) {
      for (const number of numbers) {
        deck.push({ color, shape, number });
      }
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

export function createWCSTReferenceCards(): WCSTCard[] {
  return [
    { color: 'Red', shape: 'Circle', number: 1 },
    { color: 'Green', shape: 'Star', number: 2 },
    { color: 'Blue', shape: 'Triangle', number: 3 },
    { color: 'Yellow', shape: 'Square', number: 4 }
  ];
}

export function chooseWCSTRule(): 'color' | 'shape' | 'number' {
  const rules: ('color' | 'shape' | 'number')[] = ['color', 'shape', 'number'];
  return rules[Math.floor(Math.random() * rules.length)];
}

export function validateWCSTMatch(currentCard: WCSTCard, chosenCard: WCSTCard, rule: 'color' | 'shape' | 'number'): boolean {
  return currentCard[rule] === chosenCard[rule];
}

export function shouldSwitchWCSTRule(consecutiveCorrect: number, switchThreshold: number = 6): boolean {
  return consecutiveCorrect >= switchThreshold;
}

export function calculateWCSTScore(totalAttempts: number, totalCorrect: number, perseverationErrors: number): number {
  const accuracy = totalCorrect / totalAttempts;
  const errorPenalty = perseverationErrors * 0.1;
  return Math.max(0, Math.round((accuracy - errorPenalty) * 100));
}

export function validateWordRecall(userWords: string[], correctWords: string[]): number {
  console.log('DEBUG validateWordRecall INPUT:', {
    userWords,
    correctWords,
    userWordsLength: userWords.length,
    correctWordsLength: correctWords.length
  });
  
  // Clean and normalize words - case insensitive, remove extra spaces
  const userCleaned = userWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
  const correctCleaned = correctWords.map(w => w.trim().toLowerCase());
  
  console.log('DEBUG cleaned words:', {
    userCleaned,
    correctCleaned
  });
  
  // Count how many words are correct in the right position
  let correctCount = 0;
  const minLength = Math.min(userCleaned.length, correctCleaned.length);
  
  // Check each word position
  for (let i = 0; i < minLength; i++) {
    const userWord = userCleaned[i];
    const correctWord = correctCleaned[i];
    const match = userWord === correctWord;
    console.log(`DEBUG word ${i}: "${userWord}" vs "${correctWord}" = ${match}`);
    
    if (match) {
      correctCount++;
    }
  }
  
  console.log('DEBUG validation result:', {
    correctCount,
    totalExpected: correctCleaned.length,
    userProvided: userCleaned.length
  });
  
  // Return the number of correct words (partial credit allowed)
  return correctCount;
}


