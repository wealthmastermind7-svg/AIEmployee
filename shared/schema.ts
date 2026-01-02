import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// BUSINESSES (Tenants)
// ========================================
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  ownerToken: text("owner_token").unique().notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  subscriptionTier: text("subscription_tier").default("free").notNull(), // free, starter, pro, enterprise
  aiCreditsRemaining: integer("ai_credits_remaining").default(100).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  agents: many(agents),
  conversations: many(conversations),
  phoneNumbers: many(phoneNumbers),
  integrations: many(integrations),
  trainingData: many(trainingData),
  usageLogs: many(usageLogs),
}));

// ========================================
// AGENTS
// ========================================
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'voice', 'chat', 'sms'
  direction: text("direction").default("inbound").notNull(), // 'inbound', 'outbound'
  initialMessage: text("initial_message"),
  personality: text("personality"), // System prompt for AI behavior
  isActive: boolean("is_active").default(true).notNull(),
  pilotMode: text("pilot_mode").default("suggestive").notNull(), // 'off', 'suggestive', 'autopilot'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ one, many }) => ({
  business: one(businesses, {
    fields: [agents.businessId],
    references: [businesses.id],
  }),
  goals: many(agentGoals),
  phoneNumbers: many(phoneNumbers),
  conversations: many(conversations),
}));

// ========================================
// AGENT GOALS
// ========================================
export const agentGoals = pgTable("agent_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  goalType: text("goal_type").notNull(), // 'collect_info', 'book_appointment', 'transfer_call', 'custom'
  fieldsToCollect: text("fields_to_collect").array(), // ['name', 'email', 'phone', 'address', 'issue']
  customInstructions: text("custom_instructions"),
  priority: integer("priority").default(0).notNull(),
});

export const agentGoalsRelations = relations(agentGoals, ({ one }) => ({
  agent: one(agents, {
    fields: [agentGoals.agentId],
    references: [agents.id],
  }),
}));

// ========================================
// PHONE NUMBERS
// ========================================
export const phoneNumbers = pgTable("phone_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id),
  phoneNumber: text("phone_number").unique().notNull(),
  twilioSid: text("twilio_sid").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const phoneNumbersRelations = relations(phoneNumbers, ({ one }) => ({
  business: one(businesses, {
    fields: [phoneNumbers.businessId],
    references: [businesses.id],
  }),
  agent: one(agents, {
    fields: [phoneNumbers.agentId],
    references: [agents.id],
  }),
}));

// ========================================
// CONVERSATIONS (Unified Inbox)
// ========================================
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id),
  channel: text("channel").notNull(), // 'phone', 'sms', 'whatsapp', 'instagram', 'facebook', 'webchat'
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status").default("active").notNull(), // 'active', 'resolved', 'transferred'
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  summary: text("summary"), // AI-generated conversation summary
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  business: one(businesses, {
    fields: [conversations.businessId],
    references: [businesses.id],
  }),
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  messages: many(messages),
}));

// ========================================
// MESSAGES
// ========================================
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // 'user', 'agent', 'system'
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  wasAutoGenerated: boolean("was_auto_generated").default(false).notNull(),
  wasApproved: boolean("was_approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ========================================
// TRAINING DATA
// ========================================
export const trainingData = pgTable("training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  type: text("type").notNull(), // 'qa_pair', 'website_crawl', 'document'
  question: text("question"),
  answer: text("answer"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingDataRelations = relations(trainingData, ({ one }) => ({
  business: one(businesses, {
    fields: [trainingData.businessId],
    references: [businesses.id],
  }),
}));

// ========================================
// INTEGRATIONS (OAuth tokens)
// ========================================
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  provider: text("provider").notNull(), // 'google', 'facebook', 'instagram', 'whatsapp', 'stripe'
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  status: text("status").default("disconnected").notNull(), // 'connected', 'disconnected', 'error'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  business: one(businesses, {
    fields: [integrations.businessId],
    references: [businesses.id],
  }),
}));

// ========================================
// USAGE LOGS
// ========================================
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  type: text("type").notNull(), // 'ai_message', 'voice_minute', 'sms_sent', 'call_made'
  quantity: integer("quantity").default(1).notNull(),
  creditsUsed: integer("credits_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  business: one(businesses, {
    fields: [usageLogs.businessId],
    references: [businesses.id],
  }),
}));

// ========================================
// SCHEMA EXPORTS & TYPES
// ========================================

// Insert Schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export const insertAgentGoalSchema = createInsertSchema(agentGoals).omit({ id: true });
export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertTrainingDataSchema = createInsertSchema(trainingData).omit({ id: true, createdAt: true });
export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true });
export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({ id: true, createdAt: true });

// Types
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type AgentGoal = typeof agentGoals.$inferSelect;
export type InsertAgentGoal = z.infer<typeof insertAgentGoalSchema>;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type TrainingData = typeof trainingData.$inferSelect;
export type InsertTrainingData = z.infer<typeof insertTrainingDataSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
