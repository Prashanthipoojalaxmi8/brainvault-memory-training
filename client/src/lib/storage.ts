import { GameMode, GameStats } from "@shared/schema";

interface StoredProgress {
  bestScores: Record<GameMode, number>;
  bestLevels: Record<GameMode, number>;
  totalSessions: number;
  overallStats: {
    totalCorrect: number;
    totalIncorrect: number;
    totalTime: number;
    sessionsCompleted: number;
  };
  lastPlayed: string;
}

const STORAGE_KEY = 'wms-training-progress';

const defaultProgress: StoredProgress = {
  bestScores: {
    'ds-forward': 0,
    'ds-backward': 0,
    'spatial-forward': 0,
    'spatial-backward': 0,
    'operation-span': 0
  },
  bestLevels: {
    'ds-forward': 0,
    'ds-backward': 0,
    'spatial-forward': 0,
    'spatial-backward': 0,
    'operation-span': 0
  },
  totalSessions: 0,
  overallStats: {
    totalCorrect: 0,
    totalIncorrect: 0,
    totalTime: 0,
    sessionsCompleted: 0
  },
  lastPlayed: new Date().toISOString()
};

export function getStoredProgress(): StoredProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultProgress, ...parsed };
    }
    return defaultProgress;
  } catch (error) {
    console.error('Error reading stored progress:', error);
    return defaultProgress;
  }
}

export function saveProgress(progress: Partial<StoredProgress>): void {
  try {
    const current = getStoredProgress();
    const updated = { ...current, ...progress, lastPlayed: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function updateGameResult(
  mode: GameMode, 
  level: number, 
  score: number, 
  correct: number, 
  incorrect: number, 
  totalTime: number
): void {
  const progress = getStoredProgress();
  
  // Update best scores and levels
  if (score > progress.bestScores[mode]) {
    progress.bestScores[mode] = score;
  }
  if (level > progress.bestLevels[mode]) {
    progress.bestLevels[mode] = level;
  }
  
  // Update overall stats
  progress.overallStats.totalCorrect += correct;
  progress.overallStats.totalIncorrect += incorrect;
  progress.overallStats.totalTime += totalTime;
  progress.overallStats.sessionsCompleted += 1;
  progress.totalSessions += 1;
  
  saveProgress(progress);
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
}

export function getOverallSuccessRate(): number {
  const progress = getStoredProgress();
  const total = progress.overallStats.totalCorrect + progress.overallStats.totalIncorrect;
  if (total === 0) return 0;
  return Math.round((progress.overallStats.totalCorrect / total) * 100);
}

export function getAverageResponseTime(): number {
  const progress = getStoredProgress();
  if (progress.overallStats.sessionsCompleted === 0) return 0;
  return Math.round(progress.overallStats.totalTime / progress.overallStats.sessionsCompleted / 1000 * 10) / 10;
}

export function getAverageSpanLength(): number {
  const progress = getStoredProgress();
  const levels = Object.values(progress.bestLevels);
  const totalLevels = levels.reduce((sum, level) => sum + level, 0);
  const completedModes = levels.filter(level => level > 0).length;
  if (completedModes === 0) return 0;
  return Math.round((totalLevels / completedModes) * 10) / 10;
}
