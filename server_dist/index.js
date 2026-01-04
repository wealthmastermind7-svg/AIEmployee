var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agentGoals: () => agentGoals,
  agentGoalsRelations: () => agentGoalsRelations,
  agents: () => agents,
  agentsRelations: () => agentsRelations,
  businesses: () => businesses,
  businessesRelations: () => businessesRelations,
  conversations: () => conversations,
  conversationsRelations: () => conversationsRelations,
  insertAgentGoalSchema: () => insertAgentGoalSchema,
  insertAgentSchema: () => insertAgentSchema,
  insertBusinessSchema: () => insertBusinessSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertIntegrationSchema: () => insertIntegrationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPhoneNumberSchema: () => insertPhoneNumberSchema,
  insertTrainingDataSchema: () => insertTrainingDataSchema,
  insertUsageLogSchema: () => insertUsageLogSchema,
  integrations: () => integrations,
  integrationsRelations: () => integrationsRelations,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  phoneNumbers: () => phoneNumbers,
  phoneNumbersRelations: () => phoneNumbersRelations,
  trainingData: () => trainingData,
  trainingDataRelations: () => trainingDataRelations,
  usageLogs: () => usageLogs,
  usageLogsRelations: () => usageLogsRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  ownerToken: text("owner_token").unique().notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  // free, starter, pro, enterprise
  aiCreditsRemaining: integer("ai_credits_remaining").default(100).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var businessesRelations = relations(businesses, ({ many }) => ({
  agents: many(agents),
  conversations: many(conversations),
  phoneNumbers: many(phoneNumbers),
  integrations: many(integrations),
  trainingData: many(trainingData),
  usageLogs: many(usageLogs)
}));
var agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'voice', 'chat', 'sms'
  direction: text("direction").default("inbound").notNull(),
  // 'inbound', 'outbound'
  initialMessage: text("initial_message"),
  personality: text("personality"),
  // System prompt for AI behavior
  isActive: boolean("is_active").default(true).notNull(),
  pilotMode: text("pilot_mode").default("suggestive").notNull(),
  // 'off', 'suggestive', 'autopilot'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var agentsRelations = relations(agents, ({ one, many }) => ({
  business: one(businesses, {
    fields: [agents.businessId],
    references: [businesses.id]
  }),
  goals: many(agentGoals),
  phoneNumbers: many(phoneNumbers),
  conversations: many(conversations)
}));
var agentGoals = pgTable("agent_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  goalType: text("goal_type").notNull(),
  // 'collect_info', 'book_appointment', 'transfer_call', 'custom'
  fieldsToCollect: text("fields_to_collect").array(),
  // ['name', 'email', 'phone', 'address', 'issue']
  customInstructions: text("custom_instructions"),
  priority: integer("priority").default(0).notNull()
});
var agentGoalsRelations = relations(agentGoals, ({ one }) => ({
  agent: one(agents, {
    fields: [agentGoals.agentId],
    references: [agents.id]
  })
}));
var phoneNumbers = pgTable("phone_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id),
  phoneNumber: text("phone_number").unique().notNull(),
  twilioSid: text("twilio_sid").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var phoneNumbersRelations = relations(phoneNumbers, ({ one }) => ({
  business: one(businesses, {
    fields: [phoneNumbers.businessId],
    references: [businesses.id]
  }),
  agent: one(agents, {
    fields: [phoneNumbers.agentId],
    references: [agents.id]
  })
}));
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id),
  channel: text("channel").notNull(),
  // 'phone', 'sms', 'whatsapp', 'instagram', 'facebook', 'webchat'
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status").default("active").notNull(),
  // 'active', 'resolved', 'transferred'
  sentiment: text("sentiment"),
  // 'positive', 'neutral', 'negative'
  summary: text("summary"),
  // AI-generated conversation summary
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var conversationsRelations = relations(conversations, ({ one, many }) => ({
  business: one(businesses, {
    fields: [conversations.businessId],
    references: [businesses.id]
  }),
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id]
  }),
  messages: many(messages)
}));
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(),
  // 'user', 'agent', 'system'
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  wasAutoGenerated: boolean("was_auto_generated").default(false).notNull(),
  wasApproved: boolean("was_approved"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  })
}));
var trainingData = pgTable("training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id),
  type: text("type").notNull(),
  // 'qa_pair', 'website_crawl', 'document'
  question: text("question"),
  answer: text("answer"),
  content: text("content"),
  // For website crawl content
  title: text("title"),
  // Page title for crawled content
  sourceUrl: text("source_url"),
  status: text("status").default("active").notNull(),
  // 'active', 'processing', 'error'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var trainingDataRelations = relations(trainingData, ({ one }) => ({
  business: one(businesses, {
    fields: [trainingData.businessId],
    references: [businesses.id]
  }),
  agent: one(agents, {
    fields: [trainingData.agentId],
    references: [agents.id]
  })
}));
var integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  provider: text("provider").notNull(),
  // 'google', 'facebook', 'instagram', 'whatsapp', 'stripe'
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  status: text("status").default("disconnected").notNull(),
  // 'connected', 'disconnected', 'error'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var integrationsRelations = relations(integrations, ({ one }) => ({
  business: one(businesses, {
    fields: [integrations.businessId],
    references: [businesses.id]
  })
}));
var usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  type: text("type").notNull(),
  // 'ai_message', 'voice_minute', 'sms_sent', 'call_made'
  quantity: integer("quantity").default(1).notNull(),
  creditsUsed: integer("credits_used"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usageLogsRelations = relations(usageLogs, ({ one }) => ({
  business: one(businesses, {
    fields: [usageLogs.businessId],
    references: [businesses.id]
  })
}));
var insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
var insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
var insertAgentGoalSchema = createInsertSchema(agentGoals).omit({ id: true });
var insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({ id: true, createdAt: true });
var insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
var insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
var insertTrainingDataSchema = createInsertSchema(trainingData).omit({ id: true, createdAt: true });
var insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true });
var insertUsageLogSchema = createInsertSchema(usageLogs).omit({ id: true, createdAt: true });

// server/db.ts
var { Pool } = pkg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/routes.ts
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import OpenAI from "openai";
import twilio from "twilio";
import { Resend } from "resend";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
var twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith("AC") ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
if (twilioClient) {
  console.log("Twilio initialized securely with environment variables.");
}
var resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
function generateOwnerToken() {
  return randomBytes(32).toString("hex");
}
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + randomBytes(4).toString("hex");
}
async function registerRoutes(app2) {
  app2.post("/api/businesses", async (req, res) => {
    try {
      const { name, email, phone, website } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Business name is required" });
      }
      const ownerToken = generateOwnerToken();
      const slug = generateSlug(name);
      const [business] = await db.insert(businesses).values({
        name,
        slug,
        ownerToken,
        email,
        phone,
        website
      }).returning();
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ error: "Failed to create business" });
    }
  });
  app2.get("/api/businesses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ownerToken = req.headers["x-owner-token"];
      const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      if (ownerToken && business.ownerToken !== ownerToken) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });
  app2.patch("/api/businesses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, website, notificationsEnabled, subscriptionTier } = req.body;
      const safeUpdates = {};
      if (name !== void 0) safeUpdates.name = name;
      if (email !== void 0) safeUpdates.email = email;
      if (phone !== void 0) safeUpdates.phone = phone;
      if (website !== void 0) safeUpdates.website = website;
      if (notificationsEnabled !== void 0) safeUpdates.notificationsEnabled = notificationsEnabled;
      if (subscriptionTier !== void 0) safeUpdates.subscriptionTier = subscriptionTier;
      if (Object.keys(safeUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const [business] = await db.update(businesses).set(safeUpdates).where(eq(businesses.id, id)).returning();
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ error: "Failed to update business" });
    }
  });
  app2.get("/api/me", async (req, res) => {
    try {
      const ownerToken = req.headers["x-owner-token"];
      if (!ownerToken) {
        return res.status(401).json({ error: "Owner token required" });
      }
      const [business] = await db.select().from(businesses).where(eq(businesses.ownerToken, ownerToken));
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });
  app2.get("/api/businesses/:businessId/agents", async (req, res) => {
    try {
      const { businessId } = req.params;
      const agentList = await db.select().from(agents).where(eq(agents.businessId, businessId)).orderBy(desc(agents.createdAt));
      res.json(agentList);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });
  app2.post("/api/businesses/:businessId/agents", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { name, type, direction, initialMessage, personality, pilotMode } = req.body;
      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }
      const [agent] = await db.insert(agents).values({
        businessId,
        name,
        type,
        direction: direction || "inbound",
        initialMessage,
        personality,
        pilotMode: pilotMode || "suggestive"
      }).returning();
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });
  app2.get("/api/agents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const goals = await db.select().from(agentGoals).where(eq(agentGoals.agentId, id));
      res.json({ ...agent, goals });
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });
  app2.patch("/api/agents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const [agent] = await db.update(agents).set(updates).where(eq(agents.id, id)).returning();
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });
  app2.delete("/api/agents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(agentGoals).where(eq(agentGoals.agentId, id));
      await db.delete(agents).where(eq(agents.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });
  app2.get("/api/agents/:agentId/goals", async (req, res) => {
    try {
      const { agentId } = req.params;
      const goals = await db.select().from(agentGoals).where(eq(agentGoals.agentId, agentId)).orderBy(agentGoals.priority);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });
  app2.post("/api/agents/:agentId/goals", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { goalType, fieldsToCollect, customInstructions, priority } = req.body;
      const [goal] = await db.insert(agentGoals).values({
        agentId,
        goalType,
        fieldsToCollect,
        customInstructions,
        priority: priority || 0
      }).returning();
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });
  app2.patch("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const [goal] = await db.update(agentGoals).set(updates).where(eq(agentGoals.id, id)).returning();
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });
  app2.delete("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(agentGoals).where(eq(agentGoals.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });
  app2.get("/api/businesses/:businessId/conversations", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { channel, status } = req.query;
      let query = db.select().from(conversations).where(eq(conversations.businessId, businessId)).orderBy(desc(conversations.updatedAt));
      const conversationList = await query;
      let filtered = conversationList;
      if (channel) {
        filtered = filtered.filter((c) => c.channel === channel);
      }
      if (status) {
        filtered = filtered.filter((c) => c.status === status);
      }
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messageList = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
      res.json({ ...conversation, messages: messageList });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  app2.post("/api/businesses/:businessId/conversations", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { agentId, channel, contactName, contactEmail, contactPhone } = req.body;
      const [conversation] = await db.insert(conversations).values({
        businessId,
        agentId,
        channel: channel || "webchat",
        contactName,
        contactEmail,
        contactPhone
      }).returning();
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.patch("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const [conversation] = await db.update(conversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });
  app2.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id: conversationId } = req.params;
      const { content, role = "user" } = req.body;
      const [message] = await db.insert(messages).values({
        conversationId,
        role,
        content,
        wasAutoGenerated: false
      }).returning();
      await db.update(conversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, conversationId));
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.post("/api/ai/generate-response", async (req, res) => {
    try {
      const { conversationId, pilotMode = "suggestive" } = req.body;
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      let systemPrompt = "You are a helpful AI assistant for a business. Be professional, friendly, and helpful.";
      let knowledgeBase = "";
      if (conversation.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, conversation.agentId));
        if (agent?.personality) {
          systemPrompt = agent.personality;
        }
        const agentTrainingData = await db.select().from(trainingData).where(eq(trainingData.agentId, conversation.agentId)).orderBy(desc(trainingData.createdAt)).limit(20);
        if (agentTrainingData.length > 0) {
          const qaContent = agentTrainingData.filter((d) => d.type === "qa_pair" && d.question && d.answer).map((d) => `Q: ${d.question}
A: ${d.answer}`).join("\n\n");
          const websiteContent = agentTrainingData.filter((d) => d.type === "website_crawl" && d.content).map((d) => `[Source: ${d.title || d.sourceUrl}]
${d.content?.substring(0, 2e3)}`).join("\n\n---\n\n");
          if (qaContent || websiteContent) {
            knowledgeBase = "\n\n## Knowledge Base\nUse the following information to answer questions accurately:\n\n";
            if (qaContent) {
              knowledgeBase += "### FAQ:\n" + qaContent + "\n\n";
            }
            if (websiteContent) {
              knowledgeBase += "### Website Content:\n" + websiteContent + "\n";
            }
          }
        }
      }
      const fullSystemPrompt = systemPrompt + knowledgeBase;
      const messageHistory = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      const chatMessages = [
        { role: "system", content: fullSystemPrompt },
        ...messageHistory.map((m) => ({
          role: m.role === "agent" ? "assistant" : m.role,
          content: m.content
        }))
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-realtime-preview",
        messages: chatMessages,
        max_tokens: 500
      });
      const responseContent = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      if (pilotMode === "autopilot") {
        const [savedMessage] = await db.insert(messages).values({
          conversationId,
          role: "agent",
          content: responseContent,
          wasAutoGenerated: true,
          wasApproved: true
        }).returning();
        await db.insert(usageLogs).values({
          businessId: conversation.businessId,
          type: "ai_message",
          quantity: 1,
          creditsUsed: 1
        });
        return res.json({ message: savedMessage, sent: true });
      }
      res.json({ suggestedResponse: responseContent, sent: false });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });
  app2.post("/api/ai/approve-response", async (req, res) => {
    try {
      const { conversationId, content } = req.body;
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const [message] = await db.insert(messages).values({
        conversationId,
        role: "agent",
        content,
        wasAutoGenerated: true,
        wasApproved: true
      }).returning();
      await db.insert(usageLogs).values({
        businessId: conversation.businessId,
        type: "ai_message",
        quantity: 1,
        creditsUsed: 1
      });
      res.json(message);
    } catch (error) {
      console.error("Error approving response:", error);
      res.status(500).json({ error: "Failed to approve response" });
    }
  });
  app2.post("/api/ai/summarize", async (req, res) => {
    try {
      const { conversationId } = req.body;
      const messageHistory = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      if (messageHistory.length === 0) {
        return res.json({ summary: "No messages in this conversation yet." });
      }
      const chatContent = messageHistory.map((m) => `${m.role}: ${m.content}`).join("\n");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-realtime-preview",
        messages: [
          { role: "system", content: "Summarize this conversation in 2-3 sentences." },
          { role: "user", content: chatContent }
        ],
        max_tokens: 150
      });
      const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";
      await db.update(conversations).set({ summary }).where(eq(conversations.id, conversationId));
      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing:", error);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });
  app2.get("/api/businesses/:businessId/training", async (req, res) => {
    try {
      const { businessId } = req.params;
      const data = await db.select().from(trainingData).where(eq(trainingData.businessId, businessId)).orderBy(desc(trainingData.createdAt));
      res.json(data);
    } catch (error) {
      console.error("Error fetching training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });
  app2.post("/api/businesses/:businessId/training/qa", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { question, answer } = req.body;
      const [data] = await db.insert(trainingData).values({
        businessId,
        type: "qa_pair",
        question,
        answer
      }).returning();
      res.status(201).json(data);
    } catch (error) {
      console.error("Error adding Q&A pair:", error);
      res.status(500).json({ error: "Failed to add Q&A pair" });
    }
  });
  app2.delete("/api/training/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(trainingData).where(eq(trainingData.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training data:", error);
      res.status(500).json({ error: "Failed to delete training data" });
    }
  });
  app2.get("/api/agents/:agentId/training", async (req, res) => {
    try {
      const { agentId } = req.params;
      const data = await db.select().from(trainingData).where(eq(trainingData.agentId, agentId)).orderBy(desc(trainingData.createdAt));
      res.json(data);
    } catch (error) {
      console.error("Error fetching agent training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });
  app2.post("/api/agents/:agentId/training/qa", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { question, answer } = req.body;
      const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const [data] = await db.insert(trainingData).values({
        businessId: agent.businessId,
        agentId,
        type: "qa_pair",
        question,
        answer
      }).returning();
      res.status(201).json(data);
    } catch (error) {
      console.error("Error adding Q&A pair:", error);
      res.status(500).json({ error: "Failed to add Q&A pair" });
    }
  });
  app2.post("/api/agents/:agentId/training/crawl", async (req, res) => {
    try {
      const { agentId } = req.params;
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      console.log(`Crawling website: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WorkMateBot/1.0; +https://workmate.ai)"
        }
      });
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch website: ${response.status}` });
      }
      const html = await response.text();
      const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "").replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "").replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim().substring(0, 5e4);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;
      const [data] = await db.insert(trainingData).values({
        businessId: agent.businessId,
        agentId,
        type: "website_crawl",
        title,
        content: textContent,
        sourceUrl: url,
        status: "active"
      }).returning();
      console.log(`Crawled ${url}: ${textContent.length} characters`);
      res.status(201).json({
        ...data,
        contentLength: textContent.length,
        preview: textContent.substring(0, 500)
      });
    } catch (error) {
      console.error("Error crawling website:", error);
      res.status(500).json({ error: "Failed to crawl website" });
    }
  });
  app2.get("/api/businesses/:businessId/integrations", async (req, res) => {
    try {
      const { businessId } = req.params;
      const integrationList = await db.select().from(integrations).where(eq(integrations.businessId, businessId));
      res.json(integrationList);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });
  app2.get("/api/businesses/:businessId/stats", async (req, res) => {
    try {
      const { businessId } = req.params;
      const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId));
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      const agentCount = await db.select().from(agents).where(eq(agents.businessId, businessId));
      const conversationCount = await db.select().from(conversations).where(eq(conversations.businessId, businessId));
      const activeConversations = conversationCount.filter((c) => c.status === "active");
      res.json({
        aiCreditsRemaining: business.aiCreditsRemaining,
        subscriptionTier: business.subscriptionTier,
        totalAgents: agentCount.length,
        totalConversations: conversationCount.length,
        activeConversations: activeConversations.length
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app2.get("/api/businesses/:businessId/phone-numbers", async (req, res) => {
    try {
      const { businessId } = req.params;
      const numbers = await db.select().from(phoneNumbers).where(eq(phoneNumbers.businessId, businessId));
      res.json(numbers);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      res.status(500).json({ error: "Failed to fetch phone numbers" });
    }
  });
  app2.get("/api/phone-provider/search-numbers", async (req, res) => {
    try {
      const { areaCode, country = "US" } = req.query;
      if (!twilioClient) {
        return res.status(400).json({ error: "Twilio not configured" });
      }
      const searchParams = { voiceEnabled: true, smsEnabled: true, limit: 10 };
      if (areaCode) {
        searchParams.areaCode = areaCode;
      }
      const availableNumbers = await twilioClient.availablePhoneNumbers(country).local.list(searchParams);
      res.json(availableNumbers.map((n) => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region,
        capabilities: n.capabilities
      })));
    } catch (error) {
      console.error("Error searching phone numbers:", error);
      res.status(500).json({ error: "Failed to search phone numbers" });
    }
  });
  app2.post("/api/businesses/:businessId/phone-numbers/purchase", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { phoneNumber } = req.body;
      if (!twilioClient) {
        return res.status(400).json({ error: "Twilio not configured" });
      }
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "https://example.com";
      const purchased = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber,
        voiceUrl: `${baseUrl}/api/webhooks/voice`,
        voiceMethod: "POST",
        smsUrl: `${baseUrl}/api/webhooks/sms`,
        smsMethod: "POST"
      });
      const [saved] = await db.insert(phoneNumbers).values({
        businessId,
        phoneNumber: purchased.phoneNumber,
        twilioSid: purchased.sid,
        isActive: true
      }).returning();
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error purchasing phone number:", error);
      res.status(500).json({ error: error.message || "Failed to purchase phone number" });
    }
  });
  app2.post("/api/businesses/:businessId/phone-numbers/add-existing", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber.replace(/\D/g, "")}`;
      const [existing] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.phoneNumber, formattedNumber));
      if (existing) {
        return res.status(400).json({ error: "This phone number is already registered" });
      }
      const [saved] = await db.insert(phoneNumbers).values({
        businessId,
        phoneNumber: formattedNumber,
        twilioSid: "manual-entry",
        isActive: true
      }).returning();
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error adding existing phone number:", error);
      res.status(500).json({ error: error.message || "Failed to add phone number" });
    }
  });
  app2.put("/api/phone-numbers/:phoneNumberId/assign", async (req, res) => {
    try {
      const { phoneNumberId } = req.params;
      const { agentId } = req.body;
      const [updated] = await db.update(phoneNumbers).set({ agentId: agentId || null }).where(eq(phoneNumbers.id, phoneNumberId)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Phone number not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error assigning phone number:", error);
      res.status(500).json({ error: "Failed to assign phone number" });
    }
  });
  app2.get("/api/agents/:agentId/phone-number", async (req, res) => {
    try {
      const { agentId } = req.params;
      const [number] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.agentId, agentId));
      res.json(number || null);
    } catch (error) {
      console.error("Error fetching agent phone number:", error);
      res.status(500).json({ error: "Failed to fetch phone number" });
    }
  });
  app2.get("/api/businesses/:businessId/usage", async (req, res) => {
    try {
      const { businessId } = req.params;
      const logs = await db.select().from(usageLogs).where(eq(usageLogs.businessId, businessId)).orderBy(desc(usageLogs.createdAt)).limit(50);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching usage logs:", error);
      res.status(500).json({ error: "Failed to fetch usage logs" });
    }
  });
  app2.post("/api/businesses/:businessId/usage/limit", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { limit } = req.body;
      await db.update(businesses).set({ aiCreditsRemaining: limit }).where(eq(businesses.id, businessId));
      res.json({ success: true, newLimit: limit });
    } catch (error) {
      console.error("Error updating usage limit:", error);
      res.status(500).json({ error: "Failed to update usage limit" });
    }
  });
  app2.post("/api/webhooks/voice", async (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const { To, From, CallSid } = req.body;
    console.log(`Incoming call from ${From} to ${To} (CallSid: ${CallSid})`);
    try {
      const [num] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.phoneNumber, To));
      const [agent] = num ? await db.select().from(agents).where(eq(agents.id, num.agentId)) : [null];
      if (!agent) {
        twiml.say("Thank you for calling Work Mate AI. No agent is currently assigned to this number. Please try again later.");
        return res.type("text/xml").send(twiml.toString());
      }
      const [conversation] = await db.insert(conversations).values({
        businessId: agent.businessId,
        agentId: agent.id,
        channel: "phone",
        contactPhone: From
      }).returning();
      twiml.say(agent.initialMessage || "Hello, how can I help you?");
      twiml.gather({
        input: ["speech"],
        action: `/api/webhooks/voice/process?conversationId=${conversation.id}`,
        speechTimeout: "auto"
      });
      res.type("text/xml").send(twiml.toString());
    } catch (error) {
      console.error("Voice webhook error:", error);
      twiml.say("An error occurred. Please try again later.");
      res.type("text/xml").send(twiml.toString());
    }
  });
  app2.post("/api/webhooks/sms", async (req, res) => {
    const { To, From, Body } = req.body;
    const twiml = new twilio.twiml.MessagingResponse();
    try {
      const [num] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.phoneNumber, To));
      const [agent] = num ? await db.select().from(agents).where(eq(agents.id, num.agentId)) : [null];
      if (!agent) return res.end();
      let [conversation] = await db.select().from(conversations).where(
        and(
          eq(conversations.contactPhone, From),
          eq(conversations.agentId, agent.id),
          eq(conversations.status, "active")
        )
      );
      if (!conversation) {
        [conversation] = await db.insert(conversations).values({
          businessId: agent.businessId,
          agentId: agent.id,
          channel: "sms",
          contactPhone: From
        }).returning();
      }
      await db.insert(messages).values({
        conversationId: conversation.id,
        role: "user",
        content: Body
      });
      if (agent.pilotMode === "autopilot") {
        const [business] = await db.select().from(businesses).where(eq(businesses.id, agent.businessId));
        if (business?.notificationsEnabled && business.email && resend) {
          await resend.emails.send({
            from: "WorkMate AI <onboarding@resend.dev>",
            to: business.email,
            subject: `New SMS from ${From}`,
            text: `You received a new message: ${Body}. AI is handling it.`
          });
        }
      }
      res.type("text/xml").send(twiml.toString());
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.end();
    }
  });
  app2.post("/api/webhooks/voice/process", async (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const { SpeechResult } = req.body;
    const conversationId = req.query.conversationId;
    try {
      if (SpeechResult && conversationId) {
        await db.insert(messages).values({
          conversationId,
          role: "user",
          content: SpeechResult
        });
      }
      twiml.say("Thank you for your message. We'll get back to you soon. Goodbye!");
      res.type("text/xml").send(twiml.toString());
    } catch (error) {
      console.error("Voice process error:", error);
      twiml.say("An error occurred. Goodbye.");
      res.type("text/xml").send(twiml.toString());
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
