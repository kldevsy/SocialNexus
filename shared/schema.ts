import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  status: varchar("status").default("🟢 Online"),
  customStatus: varchar("custom_status"),
  theme: varchar("theme").default("light"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Servers table
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  category: varchar("category").notNull(),
  isPublic: boolean("is_public").default(true),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  memberCount: integer("member_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Server memberships table
export const serverMemberships = pgTable("server_memberships", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => servers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("member"), // owner, admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Channels table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["text", "voice"] }).notNull().default("text"),
  serverId: integer("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content"),
  imageUrl: text("image_url"),
  embedData: text("embed_data"), // JSON string for embed data
  audioUrl: text("audio_url"), // URL or base64 string for audio data
  audioDuration: integer("audio_duration"), // Duration in seconds
  authorId: varchar("author_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Typing indicators table
export const typingIndicators = pgTable("typing_indicators", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  lastTyping: timestamp("last_typing").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedServers: many(servers),
  memberships: many(serverMemberships),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  owner: one(users, {
    fields: [servers.ownerId],
    references: [users.id],
  }),
  memberships: many(serverMemberships),
  channels: many(channels),
}));

export const serverMembershipsRelations = relations(serverMemberships, ({ one }) => ({
  server: one(servers, {
    fields: [serverMemberships.serverId],
    references: [servers.id],
  }),
  user: one(users, {
    fields: [serverMemberships.userId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  server: one(servers, {
    fields: [channels.serverId],
    references: [servers.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
}));

export const typingIndicatorsRelations = relations(typingIndicators, ({ one }) => ({
  user: one(users, {
    fields: [typingIndicators.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [typingIndicators.channelId],
    references: [channels.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServerMembershipSchema = createInsertSchema(serverMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  authorId: z.string(),
  channelId: z.number(),
});

export const insertTypingIndicatorSchema = createInsertSchema(typingIndicators).omit({
  id: true,
  lastTyping: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateServerSchema = insertServerSchema.partial();
export const updateChannelSchema = insertChannelSchema.partial();
export const updateMessageSchema = insertMessageSchema.partial();

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;
export type ServerWithOwner = Server & { owner: User };
export type InsertServerMembership = z.infer<typeof insertServerMembershipSchema>;
export type ServerMembership = typeof serverMemberships.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type ServerWithChannels = Server & { owner: User; channels: Channel[] };
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type MessageWithAuthor = Message & { author: User };
export type InsertTypingIndicator = z.infer<typeof insertTypingIndicatorSchema>;
export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type TypingIndicatorWithUser = TypingIndicator & { user: User };
