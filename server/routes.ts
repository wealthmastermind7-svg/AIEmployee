import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { 
  businesses, agents, agentGoals, conversations, messages, 
  phoneNumbers, trainingData, integrations, usageLogs,
  insertBusinessSchema, insertAgentSchema, insertAgentGoalSchema,
  insertConversationSchema, insertMessageSchema, insertTrainingDataSchema
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function generateOwnerToken(): string {
  return randomBytes(32).toString("hex");
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + randomBytes(4).toString("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ========================================
  // BUSINESS ROUTES
  // ========================================
  
  // Create/Register business
  app.post("/api/businesses", async (req: Request, res: Response) => {
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
        website,
      }).returning();
      
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ error: "Failed to create business" });
    }
  });

  // Get business by ID or ownerToken
  app.get("/api/businesses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ownerToken = req.headers["x-owner-token"] as string;
      
      const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
      
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Verify ownership
      if (ownerToken && business.ownerToken !== ownerToken) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  // Get business by owner token
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      const ownerToken = req.headers["x-owner-token"] as string;
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

  // ========================================
  // AGENT ROUTES
  // ========================================
  
  // List all agents for a business
  app.get("/api/businesses/:businessId/agents", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const agentList = await db.select().from(agents)
        .where(eq(agents.businessId, businessId))
        .orderBy(desc(agents.createdAt));
      res.json(agentList);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  // Create new agent
  app.post("/api/businesses/:businessId/agents", async (req: Request, res: Response) => {
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
        pilotMode: pilotMode || "suggestive",
      }).returning();
      
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  // Get agent details
  app.get("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Get agent goals
      const goals = await db.select().from(agentGoals).where(eq(agentGoals.agentId, id));
      
      res.json({ ...agent, goals });
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [agent] = await db.update(agents)
        .set(updates)
        .where(eq(agents.id, id))
        .returning();
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Delete related goals first
      await db.delete(agentGoals).where(eq(agentGoals.agentId, id));
      await db.delete(agents).where(eq(agents.id, id));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // ========================================
  // AGENT GOALS ROUTES
  // ========================================
  
  // Get agent goals
  app.get("/api/agents/:agentId/goals", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const goals = await db.select().from(agentGoals)
        .where(eq(agentGoals.agentId, agentId))
        .orderBy(agentGoals.priority);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Add goal
  app.post("/api/agents/:agentId/goals", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { goalType, fieldsToCollect, customInstructions, priority } = req.body;
      
      const [goal] = await db.insert(agentGoals).values({
        agentId,
        goalType,
        fieldsToCollect,
        customInstructions,
        priority: priority || 0,
      }).returning();
      
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  // Update goal
  app.patch("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [goal] = await db.update(agentGoals)
        .set(updates)
        .where(eq(agentGoals.id, id))
        .returning();
      
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // Delete goal
  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(agentGoals).where(eq(agentGoals.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // ========================================
  // CONVERSATION ROUTES (Unified Inbox)
  // ========================================
  
  // List conversations for a business
  app.get("/api/businesses/:businessId/conversations", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { channel, status } = req.query;
      
      let query = db.select().from(conversations)
        .where(eq(conversations.businessId, businessId))
        .orderBy(desc(conversations.updatedAt));
      
      const conversationList = await query;
      
      // Filter by channel or status if provided
      let filtered = conversationList;
      if (channel) {
        filtered = filtered.filter(c => c.channel === channel);
      }
      if (status) {
        filtered = filtered.filter(c => c.status === status);
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messageList = await db.select().from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);
      
      res.json({ ...conversation, messages: messageList });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create conversation
  app.post("/api/businesses/:businessId/conversations", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { agentId, channel, contactName, contactEmail, contactPhone } = req.body;
      
      const [conversation] = await db.insert(conversations).values({
        businessId,
        agentId,
        channel: channel || "webchat",
        contactName,
        contactEmail,
        contactPhone,
      }).returning();
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Update conversation status
  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [conversation] = await db.update(conversations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Send message (manual takeover)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id: conversationId } = req.params;
      const { content, role = "user" } = req.body;
      
      const [message] = await db.insert(messages).values({
        conversationId,
        role,
        content,
        wasAutoGenerated: false,
      }).returning();
      
      // Update conversation timestamp
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ========================================
  // AI PROCESSING ROUTES
  // ========================================
  
  // Generate AI response for a conversation
  app.post("/api/ai/generate-response", async (req: Request, res: Response) => {
    try {
      const { conversationId, pilotMode = "suggestive" } = req.body;
      
      // Get conversation and agent
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Get agent personality/system prompt
      let systemPrompt = "You are a helpful AI assistant for a business. Be professional, friendly, and helpful.";
      if (conversation.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, conversation.agentId));
        if (agent?.personality) {
          systemPrompt = agent.personality;
        }
      }
      
      // Get message history
      const messageHistory = await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messageHistory.map(m => ({
          role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant",
          content: m.content,
        })),
      ];
      
      // Generate response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-realtime-preview",
        messages: chatMessages,
        max_tokens: 500,
      });
      
      const responseContent = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      
      // For autopilot mode, save immediately
      if (pilotMode === "autopilot") {
        const [savedMessage] = await db.insert(messages).values({
          conversationId,
          role: "agent",
          content: responseContent,
          wasAutoGenerated: true,
          wasApproved: true,
        }).returning();
        
        // Log usage
        await db.insert(usageLogs).values({
          businessId: conversation.businessId,
          type: "ai_message",
          quantity: 1,
          creditsUsed: 1,
        });
        
        return res.json({ message: savedMessage, sent: true });
      }
      
      // For suggestive mode, return without saving
      res.json({ suggestedResponse: responseContent, sent: false });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Approve suggested response
  app.post("/api/ai/approve-response", async (req: Request, res: Response) => {
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
        wasApproved: true,
      }).returning();
      
      // Log usage
      await db.insert(usageLogs).values({
        businessId: conversation.businessId,
        type: "ai_message",
        quantity: 1,
        creditsUsed: 1,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error approving response:", error);
      res.status(500).json({ error: "Failed to approve response" });
    }
  });

  // Summarize conversation
  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.body;
      
      const messageHistory = await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      
      if (messageHistory.length === 0) {
        return res.json({ summary: "No messages in this conversation yet." });
      }
      
      const chatContent = messageHistory.map(m => `${m.role}: ${m.content}`).join("\n");
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-realtime-preview",
        messages: [
          { role: "system", content: "Summarize this conversation in 2-3 sentences." },
          { role: "user", content: chatContent },
        ],
        max_tokens: 150,
      });
      
      const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";
      
      // Update conversation with summary
      await db.update(conversations)
        .set({ summary })
        .where(eq(conversations.id, conversationId));
      
      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing:", error);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  // ========================================
  // TRAINING DATA ROUTES
  // ========================================
  
  // List training data
  app.get("/api/businesses/:businessId/training", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const data = await db.select().from(trainingData)
        .where(eq(trainingData.businessId, businessId))
        .orderBy(desc(trainingData.createdAt));
      res.json(data);
    } catch (error) {
      console.error("Error fetching training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });

  // Add Q&A pair
  app.post("/api/businesses/:businessId/training/qa", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { question, answer } = req.body;
      
      const [data] = await db.insert(trainingData).values({
        businessId,
        type: "qa_pair",
        question,
        answer,
      }).returning();
      
      res.status(201).json(data);
    } catch (error) {
      console.error("Error adding Q&A pair:", error);
      res.status(500).json({ error: "Failed to add Q&A pair" });
    }
  });

  // Delete training data
  app.delete("/api/training/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(trainingData).where(eq(trainingData.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training data:", error);
      res.status(500).json({ error: "Failed to delete training data" });
    }
  });

  // ========================================
  // INTEGRATIONS ROUTES
  // ========================================
  
  // List integrations
  app.get("/api/businesses/:businessId/integrations", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const integrationList = await db.select().from(integrations)
        .where(eq(integrations.businessId, businessId));
      res.json(integrationList);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // ========================================
  // DASHBOARD STATS
  // ========================================
  
  app.get("/api/businesses/:businessId/stats", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      
      // Get business
      const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId));
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Get counts
      const agentCount = await db.select().from(agents).where(eq(agents.businessId, businessId));
      const conversationCount = await db.select().from(conversations).where(eq(conversations.businessId, businessId));
      const activeConversations = conversationCount.filter(c => c.status === "active");
      
      res.json({
        aiCreditsRemaining: business.aiCreditsRemaining,
        subscriptionTier: business.subscriptionTier,
        totalAgents: agentCount.length,
        totalConversations: conversationCount.length,
        activeConversations: activeConversations.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ========================================
  // USAGE ROUTES
  // ========================================

  app.get("/api/businesses/:businessId/usage", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const logs = await db.select().from(usageLogs)
        .where(eq(usageLogs.businessId, businessId))
        .orderBy(desc(usageLogs.createdAt))
        .limit(50);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching usage logs:", error);
      res.status(500).json({ error: "Failed to fetch usage logs" });
    }
  });

  app.post("/api/businesses/:businessId/usage/limit", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { limit } = req.body;
      
      // For now we just update credits remaining as a way to control usage
      await db.update(businesses)
        .set({ aiCreditsRemaining: limit })
        .where(eq(businesses.id, businessId));
        
      res.json({ success: true, newLimit: limit });
    } catch (error) {
      console.error("Error updating usage limit:", error);
      res.status(500).json({ error: "Failed to update usage limit" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
