import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStatsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get game statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stats = await storage.getGameStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Save game statistics
  app.post("/api/stats", async (req, res) => {
    try {
      const validatedData = insertGameStatsSchema.parse(req.body);
      const savedStats = await storage.createGameStats(validatedData);
      res.status(201).json(savedStats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      } else {
        console.error("Error saving stats:", error);
        res.status(500).json({ message: "Failed to save statistics" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
