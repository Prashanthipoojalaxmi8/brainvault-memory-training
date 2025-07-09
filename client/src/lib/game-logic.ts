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
      answer = b;
      a = answer * a; // Make sure a is divisible by b
      question = `${a} ${op} ${b}`;
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
  const userCleaned = userWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
  const correctCleaned = correctWords.map(w => w.toLowerCase());
  
  // For Operation Span Task, we need strict validation:
  // 1. User must provide exactly the same number of words
  // 2. All words must be in the exact correct order
  // 3. Only award points if the complete sequence is perfect
  
  if (userCleaned.length !== correctCleaned.length) {
    return 0; // Wrong number of words = 0 points
  }
  
  // Check if all words match in exact order
  for (let i = 0; i < correctCleaned.length; i++) {
    if (userCleaned[i] !== correctCleaned[i]) {
      return 0; // Any word wrong = 0 points
    }
  }
  
  // Perfect match = full points
  return correctCleaned.length;
}

// Culture Fair Intelligence Test functions
export function generateCultureFairQuestions(): import('@shared/schema').CultureFairQuestion[] {
  const questionPool = [
    // Series Completion Questions - Clear progressive patterns
    {
      id: 1,
      type: 'series',
      title: 'Series Completion - Basic Pattern',
      description: 'Hint: Notice how shapes alternate between filled (black) and empty (white). The pattern repeats every 2 shapes. What comes after the white square?',
      options: ['◼️', '⬜', '🔺', '🔷'],
      correctAnswer: '◼️',
      difficulty: 1
    },
    {
      id: 2,
      type: 'series',
      title: 'Series Completion - Size Growth',
      description: 'Hint: Each shape grows larger. Start with small, then medium, then large. The pattern shows: Small → Medium → Large → ?',
      options: ['●', '⬤', '🔵', '🟦'],
      correctAnswer: '🟦',
      difficulty: 2
    },
    {
      id: 3,
      type: 'series',
      title: 'Series Completion - Shape Sides',
      description: 'Hint: Count the sides! Triangle (3) → Square (4) → Pentagon (5) → Hexagon (6) → ?',
      options: ['⭐', '⬢', '🔺', '🔶'],
      correctAnswer: '⭐',
      difficulty: 3
    },
    
    // Classification Questions - Clear odd-one-out logic
    {
      id: 4,
      type: 'classification',
      title: 'Classification - Shape Type',
      description: 'Hint: Look at the shape types. Three are the same geometric shape, one is completely different. Which one is the odd shape?',
      options: ['🔺', '🔺', '🔺', '●'],
      correctAnswer: '●',
      difficulty: 1
    },
    {
      id: 5,
      type: 'classification',
      title: 'Classification - Color Pattern',
      description: 'Hint: Three shapes share the same color, one has a different color. Which one stands out?',
      options: ['🔴', '🔴', '🔴', '🔵'],
      correctAnswer: '🔵',
      difficulty: 2
    },
    {
      id: 6,
      type: 'classification',
      title: 'Classification - Orientation',
      description: 'Hint: Check the direction each shape is pointing. Three point the same way, one points differently.',
      options: ['▲', '▲', '▲', '▼'],
      correctAnswer: '▼',
      difficulty: 3
    },
    
    // Matrices Questions - Clear grid patterns
    {
      id: 7,
      type: 'matrices',
      title: 'Matrices - Addition Pattern',
      description: 'Hint: Look at each row. The third shape combines features from the first two. Row 1: Empty + Filled = Filled. Row 2: Filled + Empty = ?',
      options: ['◼️', '⬜', '🔺', '◆'],
      correctAnswer: '⬜',
      difficulty: 2
    },
    {
      id: 8,
      type: 'matrices',
      title: 'Matrices - Column Pattern',
      description: 'Hint: Each column shows the same shape in different sizes. Column 1: Small → Medium → Large. Column 2: follows the same pattern.',
      options: ['🔸', '🔹', '🔷', '⬛'],
      correctAnswer: '🔷',
      difficulty: 3
    },
    {
      id: 9,
      type: 'matrices',
      title: 'Matrices - Rotation Pattern',
      description: 'Hint: Shapes rotate clockwise. Row 1: 0° → 90° → 180°. Row 2: 0° → 90° → ? (What comes after 90°?)',
      options: ['◆', '◇', '⬟', '🔶'],
      correctAnswer: '◆',
      difficulty: 4
    },
    
    // Conditions Questions - Clear logical rules
    {
      id: 10,
      type: 'conditions',
      title: 'Conditions - Direction Rule',
      description: 'Hint: The rule is simple - if a triangle points UP, it must be filled (black). If it points DOWN, it must be empty (white). Which triangle follows this rule?',
      options: ['▲', '▽', '🔺', '🔻'],
      correctAnswer: '▲',
      difficulty: 2
    },
    {
      id: 11,
      type: 'conditions',
      title: 'Conditions - Size Rule',
      description: 'Hint: The rule states - circles must be small (●), squares must be large (⬛). Which shape correctly follows this size rule?',
      options: ['●', '⬛', '🔵', '◼️'],
      correctAnswer: '●',
      difficulty: 3
    },
    {
      id: 12,
      type: 'conditions',
      title: 'Conditions - Sides Rule',
      description: 'Hint: Count the sides! Rule: Shapes with 3-4 sides must be red, shapes with 5+ sides must be blue. Which shape follows this rule?',
      options: ['🔴', '🔵', '🟡', '🟢'],
      correctAnswer: '🔴',
      difficulty: 4
    }
  ];
  
  // Randomly select 8 questions from the pool, ensuring variety
  const selectedQuestions = [];
  const typeGroups = {
    series: questionPool.filter(q => q.type === 'series'),
    classification: questionPool.filter(q => q.type === 'classification'),
    matrices: questionPool.filter(q => q.type === 'matrices'),
    conditions: questionPool.filter(q => q.type === 'conditions')
  };
  
  // Select 2 questions from each type
  Object.values(typeGroups).forEach(typeQuestions => {
    const shuffled = [...typeQuestions].sort(() => Math.random() - 0.5);
    selectedQuestions.push(...shuffled.slice(0, 2));
  });
  
  return selectedQuestions.sort(() => Math.random() - 0.5);
}

export function calculateCultureFairScore(correct: number, total: number): number {
  const percentage = (correct / total) * 100;
  // IQ scoring: 80 base + 10 points per correct answer
  return Math.round(80 + (percentage * 0.4));
}

export function validateCultureFairAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim() === correctAnswer.trim();
}
