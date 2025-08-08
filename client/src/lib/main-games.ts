import { MainGame, MainGameConfig, GameMode } from "@shared/schema";

export const MAIN_GAMES: Record<MainGame, MainGameConfig> = {
  'wechsler-memory-scale': {
    title: 'Wechsler Memory Scale',
    description: 'Test your working memory with digit and spatial span tasks in forward and backward directions.',
    icon: 'brain',
    color: 'blue',
    modes: ['ds-forward', 'ds-backward', 'spatial-forward', 'spatial-backward']
  },
  'operation-span-task': {
    title: 'Operation Span Task',
    description: 'Solve math problems while remembering words, then recall all words in order.',
    icon: 'calculator',
    color: 'red',
    modes: ['operation-span']
  },
  'wisconsin-card-sorting-test': {
    title: 'Wisconsin Card Sorting Test',
    description: 'Test your cognitive flexibility by matching cards according to hidden rules that change without warning.',
    icon: 'layers',
    color: 'purple',
    modes: ['wcst']
  },
  'digit-cancellation-task': {
    title: 'Digit Cancellation Task',
    description: 'Test your sustained attention and visual scanning by quickly finding and marking target digits in a grid.',
    icon: 'puzzle',
    color: 'green',
    modes: ['digit-cancellation']
  },
  'trail-making-test': {
    title: 'Trail Making Test',
    description: 'Test visual scanning, cognitive flexibility, and processing speed by connecting numbers and letters in sequence.',
    icon: 'brain',
    color: 'blue',
    modes: ['tmt-a', 'tmt-b']
  },
};

export const WMS_MODES = {
  'ds-forward': {
    title: 'Digit Span - Forward',
    description: 'Remember and repeat sequences of digits in the same order they were presented.',
    type: 'digit' as const,
    reverse: false,
    icon: 'arrow-right',
    color: 'blue'
  },
  'ds-backward': {
    title: 'Digit Span - Backward',
    description: 'Remember sequences of digits and repeat them in reverse order.',
    type: 'digit' as const,
    reverse: true,
    icon: 'arrow-left',
    color: 'purple'
  },
  'spatial-forward': {
    title: 'Spatial Span - Forward',
    description: 'Remember sequences of letters and type them in the same order.',
    type: 'letter' as const,
    reverse: false,
    icon: 'grid-3x3',
    color: 'green'
  },
  'spatial-backward': {
    title: 'Spatial Span - Backward',
    description: 'Remember sequences of letters and type them in reverse order.',
    type: 'letter' as const,
    reverse: true,
    icon: 'grid-2x2',
    color: 'orange'
  }
} as const;