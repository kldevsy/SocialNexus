import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertServerSchema, updateUserSchema, updateServerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = updateUserSchema.parse(req.body);
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Server routes
  app.post('/api/servers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const serverData = insertServerSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const server = await storage.createServer(serverData);
      res.status(201).json(server);
    } catch (error) {
      console.error("Error creating server:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create server" });
    }
  });

  app.get('/api/servers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const servers = await storage.getUserServers(userId);
      res.json(servers);
    } catch (error) {
      console.error("Error fetching user servers:", error);
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  app.get('/api/servers/discover', isAuthenticated, async (req: any, res) => {
    try {
      const { category, search, limit } = req.query;
      const servers = await storage.getPublicServers(
        limit ? parseInt(limit as string) : undefined,
        category as string,
        search as string
      );
      res.json(servers);
    } catch (error) {
      console.error("Error discovering servers:", error);
      res.status(500).json({ message: "Failed to discover servers" });
    }
  });

  app.get('/api/servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      res.json(server);
    } catch (error) {
      console.error("Error fetching server:", error);
      res.status(500).json({ message: "Failed to fetch server" });
    }
  });

  app.patch('/api/servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns the server
      const server = await storage.getServer(serverId);
      if (!server || server.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updates = updateServerSchema.parse(req.body);
      const updatedServer = await storage.updateServer(serverId, updates);
      
      res.json(updatedServer);
    } catch (error) {
      console.error("Error updating server:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update server" });
    }
  });

  app.delete('/api/servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns the server
      const server = await storage.getServer(serverId);
      if (!server || server.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await storage.deleteServer(serverId);
      if (!deleted) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      res.json({ message: "Server deleted successfully" });
    } catch (error) {
      console.error("Error deleting server:", error);
      res.status(500).json({ message: "Failed to delete server" });
    }
  });

  // Membership routes
  app.post('/api/servers/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const membership = await storage.joinServer(serverId, userId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error joining server:", error);
      res.status(500).json({ message: "Failed to join server" });
    }
  });

  app.delete('/api/servers/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const left = await storage.leaveServer(serverId, userId);
      if (!left) {
        return res.status(404).json({ message: "Membership not found" });
      }
      
      res.json({ message: "Left server successfully" });
    } catch (error) {
      console.error("Error leaving server:", error);
      res.status(500).json({ message: "Failed to leave server" });
    }
  });

  app.get('/api/servers/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      const members = await storage.getServerMembers(serverId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching server members:", error);
      res.status(500).json({ message: "Failed to fetch server members" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
