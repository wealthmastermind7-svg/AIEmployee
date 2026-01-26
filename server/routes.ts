import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { 
  businesses, agents, agentGoals, conversations, messages, 
  phoneNumbers, trainingData, integrations, usageLogs,
  insertBusinessSchema, insertAgentSchema, insertAgentGoalSchema,
  insertConversationSchema, insertMessageSchema, insertTrainingDataSchema
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import OpenAI from "openai";
import twilio from "twilio";
import { Resend } from "resend";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (twilioClient) {
  console.log("Twilio initialized securely with environment variables.");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

  // Update business (with whitelisted fields only)
  app.patch("/api/businesses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, phone, website, notificationsEnabled, subscriptionTier, metadata } = req.body;
      
      // Only allow updating specific fields (not ownerToken or slug)
      const safeUpdates: Record<string, any> = {};
      if (name !== undefined) safeUpdates.name = name;
      if (email !== undefined) safeUpdates.email = email;
      if (phone !== undefined) safeUpdates.phone = phone;
      if (website !== undefined) safeUpdates.website = website;
      if (notificationsEnabled !== undefined) safeUpdates.notificationsEnabled = notificationsEnabled;
      if (subscriptionTier !== undefined) safeUpdates.subscriptionTier = subscriptionTier;
      if (metadata !== undefined) safeUpdates.metadata = metadata;
      
      if (Object.keys(safeUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const [business] = await db.update(businesses)
        .set(safeUpdates)
        .where(eq(businesses.id, id))
        .returning();
      
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      res.json(business);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ error: "Failed to update business" });
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
      let knowledgeBase = "";
      
      if (conversation.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, conversation.agentId));
        if (agent?.personality) {
          systemPrompt = agent.personality;
        }
        
        // Get training data for this agent (knowledge base)
        const agentTrainingData = await db.select().from(trainingData)
          .where(eq(trainingData.agentId, conversation.agentId))
          .orderBy(desc(trainingData.createdAt))
          .limit(20);
        
        if (agentTrainingData.length > 0) {
          const qaContent = agentTrainingData
            .filter(d => d.type === "qa_pair" && d.question && d.answer)
            .map(d => `Q: ${d.question}\nA: ${d.answer}`)
            .join("\n\n");
          
          const websiteContent = agentTrainingData
            .filter(d => d.type === "website_crawl" && d.content)
            .map(d => `[Source: ${d.title || d.sourceUrl}]\n${d.content?.substring(0, 2000)}`)
            .join("\n\n---\n\n");
          
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
      
      // Combine system prompt with knowledge base
      const fullSystemPrompt = systemPrompt + knowledgeBase;
      
      // Get message history
      const messageHistory = await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: fullSystemPrompt },
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

  // Get training data for specific agent
  app.get("/api/agents/:agentId/training", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const data = await db.select().from(trainingData)
        .where(eq(trainingData.agentId, agentId))
        .orderBy(desc(trainingData.createdAt));
      res.json(data);
    } catch (error) {
      console.error("Error fetching agent training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });

  // Add Q&A pair for agent
  app.post("/api/agents/:agentId/training/qa", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { question, answer } = req.body;
      
      // Get agent to find businessId
      const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      const [data] = await db.insert(trainingData).values({
        businessId: agent.businessId,
        agentId,
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

  // Crawl website for agent training
  app.post("/api/agents/:agentId/training/crawl", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // Get agent to find businessId
      const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Fetch website content
      console.log(`Crawling website: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WorkMateBot/1.0; +https://workmate.ai)',
        },
      });
      
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch website: ${response.status}` });
      }
      
      const html = await response.text();
      
      // Extract text content from HTML (simple extraction)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove nav
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 50000); // Limit content size
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;
      
      // Save to database
      const [data] = await db.insert(trainingData).values({
        businessId: agent.businessId,
        agentId,
        type: "website_crawl",
        title,
        content: textContent,
        sourceUrl: url,
        status: "active",
      }).returning();
      
      console.log(`Crawled ${url}: ${textContent.length} characters`);
      
      res.status(201).json({
        ...data,
        contentLength: textContent.length,
        preview: textContent.substring(0, 500),
      });
    } catch (error) {
      console.error("Error crawling website:", error);
      res.status(500).json({ error: "Failed to crawl website" });
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
  // PHONE NUMBER MANAGEMENT
  // ========================================

  // Get all phone numbers for a business
  app.get("/api/businesses/:businessId/phone-numbers", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const numbers = await db.select().from(phoneNumbers)
        .where(eq(phoneNumbers.businessId, businessId));
      res.json(numbers);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      res.status(500).json({ error: "Failed to fetch phone numbers" });
    }
  });

  // Search available Twilio phone numbers
  app.get("/api/phone-provider/search-numbers", async (req: Request, res: Response) => {
    try {
      const { areaCode, country = "US" } = req.query;
      
      if (!twilioClient) {
        return res.status(400).json({ error: "Twilio not configured" });
      }

      const searchParams: any = { voiceEnabled: true, smsEnabled: true, limit: 10 };
      if (areaCode) {
        searchParams.areaCode = areaCode as string;
      }

      const availableNumbers = await twilioClient.availablePhoneNumbers(country as string)
        .local.list(searchParams);
      
      res.json(availableNumbers.map(n => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region,
        capabilities: n.capabilities,
      })));
    } catch (error) {
      console.error("Error searching phone numbers:", error);
      res.status(500).json({ error: "Failed to search phone numbers" });
    }
  });

  // Purchase a Twilio phone number
  app.post("/api/businesses/:businessId/phone-numbers/purchase", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { phoneNumber } = req.body;

      if (!twilioClient) {
        return res.status(400).json({ error: "Twilio not configured" });
      }

      // Get webhook base URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "https://example.com";

      // Purchase the number from Twilio
      const purchased = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber,
        voiceUrl: `${baseUrl}/api/webhooks/voice`,
        voiceMethod: "POST",
        smsUrl: `${baseUrl}/api/webhooks/sms`,
        smsMethod: "POST",
      });

      // Save to database
      const [saved] = await db.insert(phoneNumbers).values({
        businessId,
        phoneNumber: purchased.phoneNumber,
        twilioSid: purchased.sid,
        isActive: true,
      }).returning();

      res.status(201).json(saved);
    } catch (error: any) {
      console.error("Error purchasing phone number:", error);
      res.status(500).json({ error: error.message || "Failed to purchase phone number" });
    }
  });

  // Add an existing phone number manually
  app.post("/api/businesses/:businessId/phone-numbers/add-existing", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Format phone number (ensure it starts with +)
      // Allow for more flexible formatting (keep digits and leading plus)
      const formattedNumber = phoneNumber.startsWith("+") 
        ? `+${phoneNumber.replace(/\D/g, "")}` 
        : `+${phoneNumber.replace(/\D/g, "")}`;

      // Check if number already exists
      const [existing] = await db.select().from(phoneNumbers)
        .where(sql`${phoneNumbers.phoneNumber} = ${formattedNumber} OR ${phoneNumbers.phoneNumber} = ${phoneNumber}`);
      
      if (existing) {
        return res.status(400).json({ error: "This phone number is already registered" });
      }

      // Save to database
      const [saved] = await db.insert(phoneNumbers).values({
        businessId,
        phoneNumber: formattedNumber,
        twilioSid: "manual-entry",
        isActive: true,
      }).returning();

      res.status(201).json(saved);
    } catch (error: any) {
      console.error("Error adding existing phone number:", error);
      res.status(500).json({ error: error.message || "Failed to add phone number" });
    }
  });

  // Assign phone number to an agent
  app.put("/api/phone-numbers/:phoneNumberId/assign", async (req: Request, res: Response) => {
    try {
      const { phoneNumberId } = req.params;
      const { agentId } = req.body;

      const [updated] = await db.update(phoneNumbers)
        .set({ agentId: agentId || null })
        .where(eq(phoneNumbers.id, phoneNumberId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Phone number not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error assigning phone number:", error);
      res.status(500).json({ error: "Failed to assign phone number" });
    }
  });

  // Get phone number assigned to an agent
  app.get("/api/agents/:agentId/phone-number", async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const [number] = await db.select().from(phoneNumbers)
        .where(eq(phoneNumbers.agentId, agentId));
      res.json(number || null);
    } catch (error) {
      console.error("Error fetching agent phone number:", error);
      res.status(500).json({ error: "Failed to fetch phone number" });
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

  // ========================================
  // COMMUNICATION WEBHOOKS
  // ========================================

  // Twilio Voice Webhook
  app.post("/api/webhooks/voice", async (req: Request, res: Response) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const { To, From, CallSid } = req.body;

    console.log(`Incoming call from ${From} to ${To} (CallSid: ${CallSid})`);

    try {
      // Clean incoming number (strip common characters)
      const cleanTo = To.replace(/[^\d+]/g, '');
      const digitsOnlyTo = To.replace(/\D/g, '');
      console.log(`Incoming call from ${From} to ${To} (Cleaned: ${cleanTo}) (CallSid: ${CallSid})`);

      // Find agent associated with this number (try both formatted and clean versions)
      // Enhanced lookup for international numbers
      const [num] = await db.select().from(phoneNumbers)
        .where(sql`${phoneNumbers.phoneNumber} = ${To} 
          OR ${phoneNumbers.phoneNumber} = ${cleanTo} 
          OR ${phoneNumbers.phoneNumber} = ${digitsOnlyTo}
          OR ${phoneNumbers.phoneNumber} = ${'+' + digitsOnlyTo}
          OR ${phoneNumbers.phoneNumber} = ${To.replace('+1', '')}
          OR ${phoneNumbers.phoneNumber} LIKE ${'%' + digitsOnlyTo.slice(-10)}`);
      
      let agent = null;
      let business = null;

      if (num) {
        [agent] = await db.select().from(agents).where(eq(agents.id, num.agentId!));
        if (agent) {
          [business] = await db.select().from(businesses).where(eq(businesses.id, agent.businessId));
        }
      }

      if (!agent || !business) {
        twiml.say(`Thank you for calling WorkMate AI. This number is not yet fully configured. Business owner, please ensure this number is assigned to an agent in your dashboard.`);
        return res.type('text/xml').send(twiml.toString());
      }

      // Create conversation
      const [conversation] = await db.insert(conversations).values({
        businessId: business.id,
        agentId: agent.id,
        channel: "phone",
        contactPhone: From,
      }).returning();

      // Use business and agent specific greeting
      const greeting = agent.initialMessage || `Hello, thank you for calling ${business.name}. How can I help you today?`;
      twiml.say(greeting);
      
      // Real-time voice would require deeper integration with OpenAI Realtime API via Twilio Streams
      // For now, we stub a basic gathering or simple response
      twiml.gather({
        input: ['speech'],
        action: `/api/webhooks/voice/process?conversationId=${conversation.id}`,
        speechTimeout: 'auto'
      });

      res.type('text/xml').send(twiml.toString());
    } catch (error) {
      console.error("Voice webhook error:", error);
      twiml.say("An error occurred. Please try again later.");
      res.type('text/xml').send(twiml.toString());
    }
  });

  // Twilio SMS Webhook
  app.post("/api/webhooks/sms", async (req: Request, res: Response) => {
    const { To, From, Body } = req.body;
    const twiml = new twilio.twiml.MessagingResponse();

    try {
      const [num] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.phoneNumber, To));
      const [agent] = num ? await db.select().from(agents).where(eq(agents.id, num.agentId!)) : [null];

      if (!agent) return res.end();

      // Find or create conversation
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
          contactPhone: From,
        }).returning();
      }

      // Save user message
      await db.insert(messages).values({
        conversationId: conversation.id,
        role: "user",
        content: Body,
      });

      // Simple auto-reply if autopilot is on
      if (agent.pilotMode === "autopilot") {
        // AI response generation logic (internal call or reuse generate-response logic)
        // For simplicity in this small edit, we notify the business via Resend if enabled
        const [business] = await db.select().from(businesses).where(eq(businesses.id, agent.businessId));
        if (business?.notificationsEnabled && business.email && resend) {
          await resend.emails.send({
            from: 'WorkMate AI <onboarding@resend.dev>',
            to: business.email,
            subject: `New SMS from ${From}`,
            text: `You received a new message: ${Body}. AI is handling it.`,
          });
        }
      }

      res.type('text/xml').send(twiml.toString());
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.end();
    }
  });

  // Voice process webhook (handles speech input and generates AI response)
  app.post("/api/webhooks/voice/process", async (req: Request, res: Response) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const { SpeechResult } = req.body;
    const conversationId = req.query.conversationId as string;

    try {
      if (!conversationId) {
        twiml.say("An error occurred. Missing conversation ID.");
        return res.type('text/xml').send(twiml.toString());
      }

      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      if (!conversation) {
        twiml.say("An error occurred. Conversation not found.");
        return res.type('text/xml').send(twiml.toString());
      }

      // If no speech result, ask again or goodbye
      if (!SpeechResult) {
        twiml.say("I'm sorry, I didn't catch that.");
        twiml.gather({
          input: ['speech'],
          action: `/api/webhooks/voice/process?conversationId=${conversation.id}`,
          speechTimeout: 'auto'
        });
        return res.type('text/xml').send(twiml.toString());
      }

      // 1. Save user message
      await db.insert(messages).values({
        conversationId,
        role: "user",
        content: SpeechResult,
      });

      // 2. Generate AI response
      let systemPrompt = "You are a helpful AI assistant. Be professional, friendly, and helpful. Keep responses concise for voice calls.";
      let knowledgeBase = "";

      if (conversation.agentId) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, conversation.agentId));
        const [business] = await db.select().from(businesses).where(eq(businesses.id, conversation.businessId));
        
        if (agent && business) {
          systemPrompt = `You are ${agent.name}, an AI voice agent for ${business.name}. 
${agent.personality || "Your goal is to assist customers professionally."}
Always identify as being from ${business.name}.
Keep responses very concise (1-2 sentences) as this is a voice call.`;
        }

        // Get training data
        const agentTrainingData = await db.select().from(trainingData)
          .where(eq(trainingData.agentId, conversation.agentId))
          .orderBy(desc(trainingData.createdAt))
          .limit(20);

        if (agentTrainingData.length > 0) {
          const qaContent = agentTrainingData
            .filter(d => d.type === "qa_pair" && d.question && d.answer)
            .map(d => `Q: ${d.question}\nA: ${d.answer}`)
            .join("\n\n");

          const websiteContent = agentTrainingData
            .filter(d => d.type === "website_crawl" && d.content)
            .map(d => `[Source: ${d.title || d.sourceUrl}]\n${d.content?.substring(0, 1000)}`)
            .join("\n\n---\n\n");

          if (qaContent || websiteContent) {
            knowledgeBase = "\n\n## Knowledge Base\n";
            if (qaContent) knowledgeBase += "### FAQ:\n" + qaContent + "\n";
            if (websiteContent) knowledgeBase += "### Website Content:\n" + websiteContent + "\n";
          }
        }
      }

      // Get conversation history (last 5 messages for context)
      const history = await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(6);
      
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt + knowledgeBase },
        ...history.reverse().map(m => ({
          role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant",
          content: m.content,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 150,
      });

      const responseContent = completion.choices[0]?.message?.content || "How else can I help you?";

      // 3. Save agent response
      await db.insert(messages).values({
        conversationId,
        role: "agent",
        content: responseContent,
        wasAutoGenerated: true,
        wasApproved: true,
      });

      // 4. Update conversation
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      // 5. Respond and Gather again
      twiml.say(responseContent);
      twiml.gather({
        input: ['speech'],
        action: `/api/webhooks/voice/process?conversationId=${conversation.id}`,
        speechTimeout: 'auto'
      });

      res.type('text/xml').send(twiml.toString());
    } catch (error) {
      console.error("Voice process error:", error);
      twiml.say("I'm sorry, I'm having trouble processing your request. Please try again later.");
      res.type('text/xml').send(twiml.toString());
    }
  });

  // Delete phone number
  app.delete("/api/phone-numbers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(phoneNumbers).where(eq(phoneNumbers.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting phone number:", error);
      res.status(500).json({ error: "Failed to delete phone number" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
