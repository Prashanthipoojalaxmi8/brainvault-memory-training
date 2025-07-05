import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  mode: text("mode").notNull(), // 'ds-forward', 'ds-backward', 'spatial-forward', 'spatial-backward'
  level: integer("level").notNull(),
  score: integer("score").notNull(),
  correct: integer("correct").notNull(),
  incorrect: integer("incorrect").notNull(),
  averageTime: integer("average_time").notNull(), // in milliseconds
  accuracy: integer("accuracy").notNull(), // percentage
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats).omit({
  id: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;

// Game mode types
export type GameMode = 'ds-forward' | 'ds-backward' | 'spatial-forward' | 'spatial-backward' | 'operation-span';
export type GamePhase = 'menu' | 'display' | 'input' | 'feedback';
export type OperationSpanPhase = 'math' | 'word' | 'recall' | 'feedback';

export interface GameState {
  currentMode: GameMode | null;
  currentLevel: number;
  currentScore: number;
  currentSequence: (string | number)[];
  userInput: string;
  gamePhase: GamePhase;
  timeRemaining: number;
  stats: {
    correct: number;
    incorrect: number;
    totalTime: number;
    attempts: number;
  };
}

export interface OperationSpanState {
  currentLevel: number;
  currentScore: number;
  currentPair: number;
  totalPairs: number;
  currentMathQuestion: string;
  currentMathAnswer: number;
  currentWord: string;
  rememberedWords: string[];
  userMathInput: string;
  userRecallInput: string;
  gamePhase: OperationSpanPhase;
  stats: {
    mathCorrect: number;
    mathIncorrect: number;
    wordsCorrect: number;
    totalTime: number;
    attempts: number;
  };
}

export interface ModeConfig {
  title: string;
  description: string;
  type: 'digit' | 'letter' | 'mixed';
  reverse: boolean;
  icon: string;
  color: string;
}
