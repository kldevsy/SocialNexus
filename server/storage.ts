import {
  users,
  servers,
  serverMemberships,
  channels,
  type User,
  type UpsertUser,
  type InsertServer,
  type Server,
  type ServerWithOwner,
  type InsertServerMembership,
  type ServerMembership,
  type InsertChannel,
  type Channel,
  type ServerWithChannels,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Server operations
  createServer(server: InsertServer): Promise<Server>;
  getServer(id: number): Promise<ServerWithOwner | undefined>;
  getUserServers(userId: string): Promise<ServerWithOwner[]>;
  getPublicServers(limit?: number, category?: string, search?: string): Promise<ServerWithOwner[]>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: number): Promise<boolean>;

  // Membership operations
  joinServer(serverId: number, userId: string): Promise<ServerMembership>;
  leaveServer(serverId: number, userId: string): Promise<boolean>;
  getUserMemberships(userId: string): Promise<ServerMembership[]>;
  getServerMembers(serverId: number): Promise<User[]>;
  isUserMember(serverId: number, userId: string): Promise<boolean>;

  // Channel operations
  createChannel(channel: InsertChannel): Promise<Channel>;
  getServerChannels(serverId: number): Promise<Channel[]>;
  getServerWithChannels(id: number): Promise<ServerWithChannels | undefined>;
  updateChannel(id: number, updates: Partial<Channel>): Promise<Channel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: (userData as any).id || '',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        username: userData.username,
        bio: userData.bio,
        status: userData.status,
        customStatus: userData.customStatus,
        theme: userData.theme,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          username: userData.username,
          bio: userData.bio,
          status: userData.status,
          customStatus: userData.customStatus,
          theme: userData.theme,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Server operations
  async createServer(serverData: InsertServer): Promise<Server> {
    const [server] = await db
      .insert(servers)
      .values(serverData)
      .returning();

    // Add owner as member
    await db.insert(serverMemberships).values({
      serverId: server.id,
      userId: serverData.ownerId,
      role: "owner",
    });

    // Create default channels
    await db.insert(channels).values([
      {
        name: "geral",
        description: "Canal geral para conversa",
        type: "text",
        serverId: server.id,
      },
      {
        name: "Sala de Voz",
        description: "Canal de voz principal",
        type: "voice",
        serverId: server.id,
      },
    ]);

    return server;
  }

  async getServer(id: number): Promise<ServerWithOwner | undefined> {
    const [result] = await db
      .select()
      .from(servers)
      .leftJoin(users, eq(servers.ownerId, users.id))
      .where(eq(servers.id, id));

    if (!result) return undefined;

    return {
      ...result.servers,
      owner: result.users!,
    };
  }

  async getUserServers(userId: string): Promise<ServerWithOwner[]> {
    const results = await db
      .select()
      .from(servers)
      .leftJoin(users, eq(servers.ownerId, users.id))
      .leftJoin(serverMemberships, eq(servers.id, serverMemberships.serverId))
      .where(eq(serverMemberships.userId, userId))
      .orderBy(desc(servers.createdAt));

    return results.map(result => ({
      ...result.servers,
      owner: result.users!,
    }));
  }

  async getPublicServers(limit = 20, category?: string, search?: string): Promise<ServerWithOwner[]> {
    let query = db
      .select()
      .from(servers)
      .leftJoin(users, eq(servers.ownerId, users.id))
      .where(eq(servers.isPublic, true));

    const conditions = [eq(servers.isPublic, true)];

    if (category) {
      conditions.push(eq(servers.category, category));
    }

    if (search) {
      conditions.push(
        or(
          ilike(servers.name, `%${search}%`),
          ilike(servers.description, `%${search}%`)
        )!
      );
    }

    const results = await db
      .select()
      .from(servers)
      .leftJoin(users, eq(servers.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(servers.memberCount))
      .limit(limit);

    return results.map(result => ({
      ...result.servers,
      owner: result.users!,
    }));
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined> {
    const [server] = await db
      .update(servers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(servers.id, id))
      .returning();
    return server;
  }

  async deleteServer(id: number): Promise<boolean> {
    // Delete memberships first
    await db.delete(serverMemberships).where(eq(serverMemberships.serverId, id));
    
    // Delete server
    const result = await db.delete(servers).where(eq(servers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Membership operations
  async joinServer(serverId: number, userId: string): Promise<ServerMembership> {
    // Check if already a member
    const existing = await db
      .select()
      .from(serverMemberships)
      .where(and(eq(serverMemberships.serverId, serverId), eq(serverMemberships.userId, userId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [membership] = await db
      .insert(serverMemberships)
      .values({ serverId, userId })
      .returning();

    // Update server member count
    await db
      .update(servers)
      .set({ memberCount: sql`${servers.memberCount} + 1` })
      .where(eq(servers.id, serverId));

    return membership;
  }

  async leaveServer(serverId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(serverMemberships)
      .where(and(eq(serverMemberships.serverId, serverId), eq(serverMemberships.userId, userId)));

    if ((result.rowCount || 0) > 0) {
      // Update server member count
      await db
        .update(servers)
        .set({ memberCount: sql`${servers.memberCount} - 1` })
        .where(eq(servers.id, serverId));
      return true;
    }

    return false;
  }

  async getUserMemberships(userId: string): Promise<ServerMembership[]> {
    return await db
      .select()
      .from(serverMemberships)
      .where(eq(serverMemberships.userId, userId));
  }

  async getServerMembers(serverId: number): Promise<User[]> {
    const results = await db
      .select()
      .from(users)
      .leftJoin(serverMemberships, eq(users.id, serverMemberships.userId))
      .where(eq(serverMemberships.serverId, serverId));

    return results.map(result => result.users);
  }

  async isUserMember(serverId: number, userId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(serverMemberships)
      .where(and(eq(serverMemberships.serverId, serverId), eq(serverMemberships.userId, userId)));

    return !!membership;
  }

  // Channel operations
  async createChannel(channelData: InsertChannel): Promise<Channel> {
    const [channel] = await db
      .insert(channels)
      .values(channelData)
      .returning();
    return channel;
  }

  async getServerChannels(serverId: number): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.serverId, serverId))
      .orderBy(channels.createdAt);
  }

  async getServerWithChannels(id: number): Promise<ServerWithChannels | undefined> {
    const server = await this.getServer(id);
    if (!server) return undefined;

    const serverChannels = await this.getServerChannels(id);
    
    return {
      ...server,
      channels: serverChannels,
    };
  }

  async updateChannel(id: number, updates: Partial<Channel>): Promise<Channel | undefined> {
    const [channel] = await db
      .update(channels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async deleteChannel(id: number): Promise<boolean> {
    const result = await db
      .delete(channels)
      .where(eq(channels.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
