import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { insertServerSchema, updateUserSchema, updateServerSchema, insertChannelSchema, insertMessageSchema, insertTypingIndicatorSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Try to get user from storage, if not found create one
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          username: req.user.username || 'User',
          firstName: req.user.firstName || 'Demo',
          lastName: req.user.lastName || 'User',
          profileImageUrl: req.user.profileImageUrl || null
        });
      }
      
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
      const userId = req.user.claims.sub;
      
      const server = await storage.getServerWithChannels(serverId);
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }

      // Check if user is a member or if server is public
      const isMember = await storage.isUserMember(serverId, userId);
      if (!server.isPublic && !isMember) {
        return res.status(403).json({ message: "Access denied. You must be a member to view this server." });
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
      
      // Check if server exists
      const server = await storage.getServer(serverId);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      // Check if already a member
      const isMember = await storage.isUserMember(serverId, userId);
      if (isMember) {
        return res.status(409).json({ message: "Already a member of this server" });
      }
      
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

  // Get server channels
  app.get('/api/servers/:id/channels', isAuthenticated, async (req: any, res) => {
    try {
      const serverId = parseInt(req.params.id);
      console.log(`🔍 Fetching channels for server ${serverId}`);
      
      const channels = await storage.getServerChannels(serverId);
      console.log(`📋 Found ${channels.length} channels for server ${serverId}:`, channels.map(c => ({ id: c.id, name: c.name, type: c.type })));
      
      res.json(channels);
    } catch (error) {
      console.error("❌ Error fetching server channels:", error);
      res.status(500).json({ message: "Failed to fetch server channels" });
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

  // Message routes
  
  // Get channel messages
  app.get("/api/channels/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const messages = await storage.getChannelMessages(channelId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create message
  app.post("/api/channels/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const userId = req.user?.id || req.session?.user?.id;
      
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      if (!userId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      console.log("Creating message with data:", req.body);
      console.log("UserId from auth:", userId);
      console.log("ChannelId:", channelId);

      // Create message data manually to avoid validation issues
      const messageData = {
        content: req.body.content || null,
        imageUrl: req.body.imageUrl || null,
        embedData: req.body.embedData ? JSON.stringify(req.body.embedData) : null,
        authorId: userId,
        channelId: channelId
      };
      
      console.log("Message data to insert:", messageData);

      const message = await storage.createMessage(messageData);
      
      // Broadcast new message to all connected clients in the channel
      const messageWithAuthor = {
        ...message,
        author: req.user || req.session?.user,
        embedData: message.embedData ? JSON.parse(message.embedData) : undefined
      };
      
      console.log(`📣 Broadcasting new message to channel ${channelId}`);
      let messageBroadcastCount = 0;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && (client as any).channelId === channelId) {
          client.send(JSON.stringify({
            type: 'new-message',
            channelId: channelId,
            message: messageWithAuthor
          }));
          messageBroadcastCount++;
        }
      });
      console.log(`📤 Broadcasted new message to ${messageBroadcastCount} clients`);
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Typing indicator routes
  
  // Set typing indicator (simplified - no database storage)
  app.post("/api/channels/:id/typing", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      console.log(`📥 Received typing indicator request for channel ${channelId} from user ${req.user.claims.sub}`);
      
      if (isNaN(channelId)) {
        console.log('❌ Invalid channel ID');
        return res.status(400).json({ error: "Invalid channel ID" });
      }
      
      // Get user info for broadcasting
      const user = await storage.getUser(req.user.claims.sub);
      const userName = user?.firstName || user?.email?.split('@')[0] || 'Usuário';
      
      // Broadcast typing indicator to other users in the channel
      console.log(`📝 Broadcasting typing indicator from ${userName} (${req.user.claims.sub}) to channel ${channelId}`);
      console.log(`🔍 Total WebSocket clients: ${wss.clients.size}`);
      
      let broadcastCount = 0;
      wss.clients.forEach((client) => {
        const clientChannelId = (client as any).channelId;
        const clientUserId = (client as any).userId;
        console.log(`🔍 Client: channelId=${clientChannelId}, userId=${clientUserId}, readyState=${client.readyState}`);
        
        if (client.readyState === WebSocket.OPEN && 
            clientChannelId === channelId && 
            clientUserId !== req.user.claims.sub) {
          client.send(JSON.stringify({
            type: 'user-typing',
            channelId: channelId,
            userId: req.user.claims.sub,
            userName: userName
          }));
          broadcastCount++;
          console.log(`📤 Sent typing indicator to client ${clientUserId}`);
        }
      });
      console.log(`📊 Broadcasted typing indicator to ${broadcastCount} clients`);
      
      res.json({ success: true, broadcastCount });
    } catch (error) {
      console.error("❌ Error setting typing indicator:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Clear typing indicator (simplified - no database storage)
  app.delete("/api/channels/:id/typing", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      console.log(`🛑 Received stop typing request for channel ${channelId} from user ${req.user.claims.sub}`);
      
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }
      
      // Get user info for broadcasting
      const user = await storage.getUser(req.user.claims.sub);
      const userName = user?.firstName || user?.email?.split('@')[0] || 'Usuário';
      
      // Broadcast stop typing to other users in the channel
      console.log(`🛑 Broadcasting stop typing from ${userName} (${req.user.claims.sub}) to channel ${channelId}`);
      let stopBroadcastCount = 0;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && 
            (client as any).channelId === channelId && 
            (client as any).userId !== req.user.claims.sub) {
          client.send(JSON.stringify({
            type: 'user-stop-typing',
            channelId: channelId,
            userId: req.user.claims.sub,
            userName: userName
          }));
          stopBroadcastCount++;
        }
      });
      console.log(`📤 Broadcasted stop typing to ${stopBroadcastCount} clients`);
      
      res.json({ success: true, stopBroadcastCount });
    } catch (error) {
      console.error("❌ Error clearing typing indicator:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update message (edit)
  app.patch("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      // Validate that user owns the message
      const messages = await storage.getChannelMessages(0, 1000, 0); // Get all messages to find this one
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      if (message.authorId !== req.user.claims.sub) {
        return res.status(403).json({ error: "You can only edit your own messages" });
      }

      const updatedMessage = await storage.updateMessage(messageId, req.body);
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for voice channels
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store voice channel connections
  const voiceChannels = new Map<number, Set<any>>();
  const connectedClients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: any, req) => {
    console.log('WebSocket connection established');
    let userChannelId: number | null = null;
    let userId: string | null = null;
    
    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            const authUserId = message.userId;
            (ws as any).userId = authUserId;
            connectedClients.set(authUserId, ws);
            console.log(`User ${authUserId} authenticated`);
            break;
            
          case 'join-channel':
            // User joined a channel for real-time updates
            const joinChannelId = message.channelId;
            const joinUserId = message.userId || (ws as any).userId;
            (ws as any).channelId = joinChannelId;
            (ws as any).userId = joinUserId;
            console.log(`👤 User ${joinUserId} joined channel ${joinChannelId} for real-time updates`);
            ws.send(JSON.stringify({
              type: 'channel-joined',
              channelId: joinChannelId
            }));
            break;
            
          case 'join-voice':
          case 'join-voice-channel':
            const channelId = message.channelId;
            userChannelId = channelId;
            userId = message.userId;
            
            // Store userId in the WebSocket object for later reference
            ws.userId = userId;
            ws.userName = message.userName;
            
            if (!voiceChannels.has(channelId)) {
              voiceChannels.set(channelId, new Set());
            }
            voiceChannels.get(channelId)?.add(ws);
            
            console.log(`User ${userId} joined voice channel ${channelId}. Total users: ${voiceChannels.get(channelId)?.size}`);
            
            // Notify others in the channel
            voiceChannels.get(channelId)?.forEach(client => {
              if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
                client.send(JSON.stringify({
                  type: 'user-joined-voice',
                  channelId,
                  userId: message.userId,
                  userName: message.userName
                }));
                // Also send legacy format
                client.send(JSON.stringify({
                  type: 'user-joined',
                  channelId,
                  userId: message.userId,
                  userName: message.userName
                }));
              }
            });
            
            // Send current users list to the new connection
            const currentUsers = Array.from(voiceChannels.get(channelId) || []).map((client: any) => ({
              userId: client.userId,
              userName: client.userName
            })).filter(user => user.userId && user.userId !== userId);
            
            ws.send(JSON.stringify({
              type: 'voice-users',
              channelId,
              count: voiceChannels.get(channelId)?.size || 0,
              users: currentUsers
            }));
            
            // Also send legacy format
            ws.send(JSON.stringify({
              type: 'channel-users',
              channelId,
              userCount: voiceChannels.get(channelId)?.size || 0,
              users: currentUsers
            }));
            
            // Broadcast updated user count to all users in channel
            const currentCount = voiceChannels.get(channelId)?.size || 0;
            voiceChannels.get(channelId)?.forEach(client => {
              if (client.readyState === 1) { // WebSocket.OPEN = 1
                client.send(JSON.stringify({
                  type: 'voice-users',
                  channelId,
                  count: currentCount
                }));
                client.send(JSON.stringify({
                  type: 'channel-users',
                  channelId,
                  userCount: currentCount
                }));
              }
            });
            break;
            
          case 'leave-voice':
          case 'leave-voice-channel':
            const leaveChannelId = message.channelId;
            if (voiceChannels.has(leaveChannelId)) {
              voiceChannels.get(leaveChannelId)?.delete(ws);
              
              // Notify others
              voiceChannels.get(leaveChannelId)?.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN = 1
                  client.send(JSON.stringify({
                    type: 'user-left-voice',
                    channelId: leaveChannelId,
                    userId: message.userId
                  }));
                  // Also send legacy format
                  client.send(JSON.stringify({
                    type: 'user-left',
                    channelId: leaveChannelId,
                    userId: message.userId
                  }));
                }
              });
            }
            break;
            
          case 'webrtc-signal':
          case 'voice-signal':
            // WebRTC signaling relay
            const targetUserId = message.targetUserId || message.to;
            const fromUserId = message.fromUserId || message.from;
            const signalChannelId = message.channelId;
            
            console.log(`🔄 Relaying voice signal from ${fromUserId} to ${targetUserId} in channel ${signalChannelId || userChannelId || 'undefined'}`);
            console.log(`🔍 Signal type: ${message.signal?.type}`);
            
            // Find the channel this user is in if channelId is missing
            let actualChannelId = signalChannelId || userChannelId;
            if (!actualChannelId) {
              // Search for the user in all channels
              for (const [channelId, clients] of Array.from(voiceChannels.entries())) {
                for (const client of Array.from(clients)) {
                  if ((client as any).userId === targetUserId || (client as any).userId === fromUserId) {
                    actualChannelId = channelId;
                    break;
                  }
                }
                if (actualChannelId) break;
              }
            }
            
            console.log(`🎯 Using channel ID: ${actualChannelId} (original: ${signalChannelId})`);
            
            if (actualChannelId && voiceChannels.has(actualChannelId)) {
              // Find the specific target user's WebSocket connection
              let targetFound = false;
              const channelClients = Array.from(voiceChannels.get(actualChannelId) || []);
              
              console.log(`🧮 Total clients in channel ${actualChannelId}: ${channelClients.length}`);
              channelClients.forEach((client: any, index) => {
                console.log(`👤 Client ${index}: userId=${client.userId}, readyState=${client.readyState}`);
              });
              
              channelClients.forEach((client: any) => {
                if (client !== ws && client.readyState === 1 && client.userId === targetUserId) {
                  console.log(`✅ Signal relayed to target user ${targetUserId}`);
                  client.send(JSON.stringify(message));
                  targetFound = true;
                }
              });
              
              if (!targetFound) {
                console.log(`❌ Target user ${targetUserId} not found in channel ${actualChannelId}`);
                // Try broadcasting to all users as fallback
                channelClients.forEach((client: any) => {
                  if (client !== ws && client.readyState === 1) {
                    console.log(`🔄 Broadcasting signal to user ${client.userId} as fallback`);
                    client.send(JSON.stringify(message));
                  }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      const wsUserId = (ws as any).userId;
      console.log(`WebSocket closed for user ${wsUserId} in channel ${userChannelId}`);
      
      // Remove from connected clients
      if (wsUserId) {
        connectedClients.delete(wsUserId);
      }
      
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
                type: 'voice-users',
                channelId: userChannelId,
                count: clients.size
              }));
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
