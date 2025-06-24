import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertServerSchema, updateUserSchema, updateServerSchema, insertChannelSchema } from "@shared/schema";
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
      const server = await storage.getServerWithChannels(serverId);
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }

      // Get server members
      const members = await storage.getServerMembers(serverId);
      
      res.json({ ...server, members });
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

  // Create channel (owner only)
  app.post("/api/servers/:id/channels", isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      if (isNaN(serverId)) {
        return res.status(400).json({ message: "Invalid server ID" });
      }

      const server = await storage.getServer(serverId);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }

      // Check if user is the owner
      if (server.ownerId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Only server owner can create channels" });
      }

      const validation = insertChannelSchema.safeParse({
        ...req.body,
        serverId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid channel data",
          errors: validation.error.issues 
        });
      }

      const channel = await storage.createChannel(validation.data);
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete channel (owner only)
  app.delete("/api/channels/:id", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Get all channels from all servers the user owns to find this channel
      const userServers = await storage.getUserServers(req.user.claims.sub);
      let targetServer = null;
      let targetChannel = null;

      for (const server of userServers) {
        const serverChannels = await storage.getServerChannels(server.id);
        const channel = serverChannels.find(c => c.id === channelId);
        if (channel) {
          targetServer = server;
          targetChannel = channel;
          break;
        }
      }

      if (!targetChannel || !targetServer) {
        return res.status(404).json({ message: "Channel not found or access denied" });
      }

      const success = await storage.deleteChannel(channelId);
      if (!success) {
        return res.status(404).json({ message: "Channel not found" });
      }

      res.json({ message: "Channel deleted successfully" });
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for voice channels
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store voice channel connections
  const voiceChannels = new Map<number, Set<any>>();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    let userChannelId: number | null = null;
    let userId: string | null = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-voice-channel':
            const channelId = message.channelId;
            userChannelId = channelId;
            userId = message.userId;
            
            if (!voiceChannels.has(channelId)) {
              voiceChannels.set(channelId, new Set());
            }
            voiceChannels.get(channelId)?.add(ws);
            
            console.log(`User ${userId} joined voice channel ${channelId}. Total users: ${voiceChannels.get(channelId)?.size}`);
            
            // Notify others in the channel
            voiceChannels.get(channelId)?.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user-joined',
                  channelId,
                  userId: message.userId,
                  userName: message.userName
                }));
              }
            });
            
            // Send current users to the new connection
            ws.send(JSON.stringify({
              type: 'channel-users',
              channelId,
              userCount: voiceChannels.get(channelId)?.size || 0
            }));
            
            // Broadcast updated user count to all users in channel
            voiceChannels.get(channelId)?.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'channel-users',
                  channelId,
                  userCount: voiceChannels.get(channelId)?.size || 0
                }));
              }
            });
            break;
            
          case 'leave-voice-channel':
            const leaveChannelId = message.channelId;
            if (voiceChannels.has(leaveChannelId)) {
              voiceChannels.get(leaveChannelId)?.delete(ws);
              
              // Notify others
              voiceChannels.get(leaveChannelId)?.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN = 1
                  client.send(JSON.stringify({
                    type: 'user-left',
                    channelId: leaveChannelId,
                    userId: message.userId
                  }));
                }
              });
            }
            break;
            
          case 'voice-signal':
            // Simple signaling for WebRTC (peer-to-peer audio)
            const targetChannelId = message.channelId;
            if (voiceChannels.has(targetChannelId)) {
              voiceChannels.get(targetChannelId)?.forEach(client => {
                if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
                  client.send(JSON.stringify(message));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket closed for user ${userId} in channel ${userChannelId}`);
      
      // Remove from the specific channel this user was in
      if (userChannelId && voiceChannels.has(userChannelId)) {
        const clients = voiceChannels.get(userChannelId);
        if (clients?.has(ws)) {
          clients.delete(ws);
          console.log(`Removed user ${userId} from channel ${userChannelId}. Remaining users: ${clients.size}`);
          
          // Notify others
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'user-left',
                channelId: userChannelId,
                userId
              }));
            }
          });
          
          // Broadcast updated user count
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'channel-users',
                channelId: userChannelId,
                userCount: clients.size
              }));
            }
          });
        }
      }
    });
  });
  
  return httpServer;
}
