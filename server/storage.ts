import { users, gameStats, type User, type InsertUser, type GameStats, type InsertGameStats } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getGameStats(userId?: number): Promise<GameStats[]>;
  createGameStats(stats: InsertGameStats): Promise<GameStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStats: Map<number, GameStats>;
  private currentUserId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.gameStats = new Map();
    this.currentUserId = 1;
    this.currentStatsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGameStats(userId?: number): Promise<GameStats[]> {
    const allStats = Array.from(this.gameStats.values());
    if (userId) {
      return allStats.filter(stat => stat.userId === userId);
    }
    return allStats;
  }

  async createGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    const id = this.currentStatsId++;
    const stats: GameStats = { 
      ...insertStats, 
      id, 
      completedAt: new Date()
    };
    this.gameStats.set(id, stats);
    return stats;
  }
}

export const storage = new MemStorage();
