# WorkMate AI Agent - Complete Repository Prompt

Build a multi-tenant SaaS mobile application called "WorkMate AI Agent" that provides businesses with AI-powered automation for customer communication across all channels. The app serves as a "virtual employee" handling voice calls, SMS, chat, and social media messaging with AI-driven responses and automation.

---

## REQUIRED SECRETS (Copy and paste your values)

You will be prompted to provide these secrets. Have them ready:

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (starts with "AC") | https://console.twilio.com |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | https://console.twilio.com |
| `RESEND_API_KEY` | Email notification API key | https://resend.com/api-keys |
| `SESSION_SECRET` | Random 64-character hex string | Generate: `openssl rand -hex 32` |

**Note:** OpenAI API is automatically configured through Replit's AI integrations - no manual setup needed.

**Note:** PostgreSQL database is automatically provisioned by Replit.

---

## PLATFORM & TECHNOLOGY STACK

- **Frontend**: React Native with Expo SDK 54 (iOS, Android, Web)
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o (via Replit AI integrations)
- **Voice/SMS**: Twilio for phone number provisioning and call/SMS handling
- **Email**: Resend for notification emails
- **State Management**: TanStack React Query
- **Navigation**: React Navigation 7+ with native stack and bottom tabs
- **UI**: Custom glass morphism components with blur effects (expo-blur)

---

## CORE FEATURES TO IMPLEMENT

### 1. Multi-Tenant Business Management
- Business registration with unique owner token for authentication
- Business profile with name, email, phone, website
- Subscription tiers: free, starter, pro, enterprise
- AI credits system for usage tracking
- Notification preferences

### 2. AI Agents
- Create multiple AI agents per business
- Agent types: voice, chat, sms
- Agent direction: inbound, outbound
- Configurable personality/system prompt
- Initial greeting message
- **Pilot Mode** with 3 levels:
  - **Off**: AI is disabled, human handles everything
  - **Suggestive**: AI suggests responses, human approves
  - **Autopilot**: AI responds automatically

### 3. Agent Goals
- Goal types: collect_info, book_appointment, transfer_call, custom
- Fields to collect: name, email, phone, address, issue (array)
- Custom instructions per goal
- Priority ordering

### 4. Agent Training (Knowledge Base)
- **Website Crawler**: Enter a URL, system fetches and extracts text content
- **Q&A Pairs**: Manually add question/answer pairs
- Training data types: qa_pair, website_crawl, document
- Knowledge base integrated into AI response generation

### 5. Unified Inbox
- All conversations across all channels in one place
- Channels: phone, sms, whatsapp, instagram, facebook, webchat
- Conversation status: active, resolved, transferred
- Sentiment analysis: positive, neutral, negative
- AI-generated conversation summaries
- Filter by status: Active, Transferred, Resolved

### 6. Phone Number Management
- **Search and Purchase**: Search available numbers by area code, purchase through API
- **Add Existing Numbers**: Register phone numbers you already own
- Assign phone numbers to agents
- Configure webhooks automatically

### 7. Voice Webhooks (Twilio)
- `/api/webhooks/voice` - Incoming call handler
- `/api/webhooks/voice/process` - Speech recognition processing
- TwiML response generation
- Automatic conversation creation

### 8. SMS Webhooks (Twilio)
- `/api/webhooks/sms` - Incoming SMS handler
- Automatic conversation threading
- Email notifications for new messages (via Resend)

### 9. Dashboard & Analytics
- Total conversations count
- Active agents count
- AI credits remaining with circular progress meter
- Quick actions for common tasks

### 10. Usage Tracking
- Track AI messages, voice minutes, SMS sent
- Credits used per action
- Usage history logs

---

## DATABASE SCHEMA

```typescript
// businesses - Multi-tenant root entity
{
  id: varchar (UUID, primary key),
  name: text (required),
  slug: text (unique, auto-generated),
  ownerToken: text (unique, for authentication),
  email: text,
  phone: text,
  website: text,
  subscriptionTier: text (default: "free"),
  aiCreditsRemaining: integer (default: 100),
  notificationsEnabled: boolean (default: true),
  createdAt: timestamp
}

// agents - AI agents per business
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  name: text (required),
  type: text (required - 'voice', 'chat', 'sms'),
  direction: text (default: "inbound"),
  initialMessage: text,
  personality: text (system prompt),
  isActive: boolean (default: true),
  pilotMode: text (default: "suggestive" - 'off', 'suggestive', 'autopilot'),
  createdAt: timestamp
}

// agent_goals - Goals for each agent
{
  id: varchar (UUID, primary key),
  agentId: varchar (foreign key to agents),
  goalType: text (required),
  fieldsToCollect: text[] (array),
  customInstructions: text,
  priority: integer (default: 0)
}

// phone_numbers - Twilio phone numbers
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  agentId: varchar (foreign key to agents, nullable),
  phoneNumber: text (unique, required),
  twilioSid: text (required),
  isActive: boolean (default: true),
  createdAt: timestamp
}

// conversations - Unified inbox
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  agentId: varchar (foreign key to agents, nullable),
  channel: text (required - 'phone', 'sms', 'whatsapp', etc.),
  contactName: text,
  contactEmail: text,
  contactPhone: text,
  status: text (default: "active"),
  sentiment: text,
  summary: text,
  createdAt: timestamp,
  updatedAt: timestamp
}

// messages - Individual messages in conversations
{
  id: varchar (UUID, primary key),
  conversationId: varchar (foreign key to conversations),
  role: text (required - 'user', 'agent', 'system'),
  content: text (required),
  audioUrl: text,
  wasAutoGenerated: boolean (default: false),
  wasApproved: boolean,
  createdAt: timestamp
}

// training_data - Knowledge base entries
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  agentId: varchar (foreign key to agents, nullable),
  type: text (required - 'qa_pair', 'website_crawl', 'document'),
  question: text,
  answer: text,
  content: text (for website crawl),
  title: text,
  sourceUrl: text,
  status: text (default: "active"),
  createdAt: timestamp
}

// integrations - OAuth tokens for third-party services
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  provider: text (required),
  accessToken: text,
  refreshToken: text,
  expiresAt: timestamp,
  status: text (default: "disconnected"),
  metadata: jsonb,
  createdAt: timestamp
}

// usage_logs - Usage tracking
{
  id: varchar (UUID, primary key),
  businessId: varchar (foreign key to businesses),
  type: text (required - 'ai_message', 'voice_minute', 'sms_sent'),
  quantity: integer (default: 1),
  creditsUsed: integer,
  createdAt: timestamp
}
```

---

## API ENDPOINTS

### Business Routes
- `POST /api/businesses` - Create business
- `GET /api/businesses/:id` - Get business by ID
- `PATCH /api/businesses/:id` - Update business
- `GET /api/me` - Get business by owner token (header: x-owner-token)

### Agent Routes
- `GET /api/businesses/:businessId/agents` - List agents
- `POST /api/businesses/:businessId/agents` - Create agent
- `GET /api/agents/:id` - Get agent with goals
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Agent Goals Routes
- `GET /api/agents/:agentId/goals` - List goals
- `POST /api/agents/:agentId/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Conversation Routes
- `GET /api/businesses/:businessId/conversations` - List conversations (query: channel, status)
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/businesses/:businessId/conversations` - Create conversation
- `PATCH /api/conversations/:id` - Update conversation
- `POST /api/conversations/:id/messages` - Send message

### AI Routes
- `POST /api/ai/generate-response` - Generate AI response (body: conversationId, pilotMode)
- `POST /api/ai/approve-response` - Approve suggested response
- `POST /api/ai/summarize` - Summarize conversation

### Training Data Routes
- `GET /api/businesses/:businessId/training` - List training data
- `POST /api/businesses/:businessId/training/qa` - Add Q&A pair
- `POST /api/businesses/:businessId/training/crawl` - Crawl website URL
- `DELETE /api/training/:id` - Delete training data
- `GET /api/agents/:agentId/training` - Get agent-specific training data
- `POST /api/agents/:agentId/training/qa` - Add Q&A to specific agent
- `POST /api/agents/:agentId/training/crawl` - Crawl URL for specific agent

### Phone Number Routes
- `GET /api/businesses/:businessId/phone-numbers` - List phone numbers
- `POST /api/phone-numbers/search` - Search available numbers (body: areaCode)
- `POST /api/phone-numbers/purchase` - Purchase new number
- `POST /api/phone-numbers/register-existing` - Register existing number
- `DELETE /api/phone-numbers/:id` - Delete phone number
- `POST /api/phone-numbers/:id/assign` - Assign to agent
- `GET /api/agents/:agentId/phone-number` - Get phone number for agent

### Stats & Usage Routes
- `GET /api/businesses/:businessId/stats` - Get dashboard stats
- `GET /api/businesses/:businessId/usage` - Get usage logs
- `POST /api/businesses/:businessId/usage/limit` - Set usage limit

### Webhooks (Configure in Twilio Console)
- `POST /api/webhooks/voice` - Voice call handler
- `POST /api/webhooks/voice/process` - Speech processing
- `POST /api/webhooks/sms` - SMS handler

---

## APP NAVIGATION STRUCTURE

### Bottom Tab Navigator (MainTabNavigator)
1. **Dashboard** (Home icon) - Stats overview, quick actions
2. **Inbox** (Message icon) - Unified conversation inbox
3. **Agents** (CPU icon) - Agent management
4. **Settings** (Gear icon) - Business settings, phone numbers, usage

### Stack Navigator (RootStackNavigator)
- `Main` - Tab navigator (no header)
- `ConversationDetail` - View/respond to conversation
- `CreateAgent` - Modal to create new agent
- `AgentDetail` - View/edit agent settings
- `AgentTraining` - Manage agent knowledge base
- `PhoneNumbers` - Manage phone numbers
- `Usage` - AI usage statistics

### Onboarding Flow
- Full-screen onboarding for new businesses
- Collect business name to create account
- Stores owner token in AsyncStorage for persistence

---

## SCREEN IMPLEMENTATIONS

### DashboardScreen
- Animated background with gradient orbs
- Stats cards: Conversations, Active Agents, AI Credits (circular progress)
- Quick action buttons
- Business name in header

### InboxScreen
- Filter tabs: All, Active, Transferred, Resolved
- List of conversations with:
  - Contact name/phone
  - Last message preview
  - Channel icon (phone, message, etc.)
  - Timestamp
  - Status indicator
- Tap to open ConversationDetailScreen

### AgentsScreen
- List of agents with:
  - Agent name and type
  - Status indicator (active/inactive)
  - Pilot mode badge
- Floating action button to create new agent
- Tap to open AgentDetailScreen

### AgentDetailScreen
- Agent info section (name, type, direction)
- Initial message editor
- Personality/system prompt editor
- Pilot mode selector (Off/Suggestive/Autopilot)
- Goals management
- Assigned phone number display
- Train button (opens AgentTrainingScreen)
- Delete agent option

### AgentTrainingScreen
- Website Crawler section:
  - URL input field
  - Crawl button
  - List of crawled URLs with content preview
- Q&A Pairs section:
  - Add new Q&A form
  - List of existing Q&A pairs
  - Delete functionality
- Training data limited to 20 most recent items
- Website content truncated to 2000 characters

### PhoneNumberScreen
- Add Existing Number section:
  - Phone number input
  - Add button
- Search New Numbers section:
  - Area code input
  - Search button
  - Results list with Buy button
- Owned Numbers section:
  - List of purchased/registered numbers
  - Agent assignment dropdown per number
  - Delete option

### SettingsScreen
- Business profile section
- Phone Numbers link
- AI Usage link
- Notifications toggle
- Subscription tier display

### ConversationDetailScreen
- Message thread display
- Message input field
- Send button
- AI suggestion panel (for suggestive mode)
- Conversation status controls

### CreateAgentScreen (Modal)
- Name input
- Type selector (voice/chat/sms)
- Direction selector (inbound/outbound)
- Create button

### UsageScreen
- AI credits remaining
- Usage history table
- Credit limit controls

---

## DESIGN SYSTEM

### Color Palette
```
Primary: #135bec (vibrant blue)
Background: #101622 (deep navy)
Glass Panel: rgba(23, 29, 41, 0.6)
Glass Border: rgba(255, 255, 255, 0.08)
Text: #ffffff
Text Secondary: rgba(255, 255, 255, 0.6)
Success: #34d399 (emerald)
Warning: #f59e0b
Error: #ef4444
```

### Glass Morphism
- Frosted glass cards with 24px blur
- Subtle borders at 8% white opacity
- Deep shadows for depth

### Typography
- Font: Inter (system default)
- Large stats: 40-48px, weight 900
- Headers: 16-18px, weight 600
- Body: 14px, weight 400-500
- Labels: 10-12px, uppercase, 60% opacity

### Animations
- Animated gradient orbs in background
- Smooth transitions (300-400ms)
- Scale on press (0.97-0.98)
- Pulse animations for status indicators

---

## TWILIO WEBHOOK CONFIGURATION

After deploying your app, configure these webhooks in the Twilio Console for each phone number:

**Voice Webhook:**
```
https://YOUR-DEPLOYED-URL.replit.app/api/webhooks/voice
Method: POST
```

**SMS Webhook:**
```
https://YOUR-DEPLOYED-URL.replit.app/api/webhooks/sms
Method: POST
```

---

## IMPLEMENTATION NOTES

1. **Business Context**: Use React Context to store current business ID and owner token, persisted in AsyncStorage

2. **API Client**: Use TanStack React Query with a default fetcher. Construct URLs with `getApiUrl()` helper.

3. **Twilio Initialization**: Check for valid credentials before initializing client. Account SID must start with "AC".

4. **AI Knowledge Base Integration**: When generating responses, fetch training data for the agent and include in system prompt.

5. **Website Crawler**: Simple fetch with text extraction. Limit content to 2000 characters per page.

6. **Phone Number Registration**: For existing numbers, create a record with the Twilio SID as the phone number itself (user must configure webhooks manually).

7. **Error Handling**: All API routes wrapped in try/catch with appropriate error responses.

8. **Database Migrations**: Use `npm run db:push` to sync schema changes.

---

## QUICK START CHECKLIST

1. Create new Expo app on Replit
2. Request these secrets when prompted:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - RESEND_API_KEY
   - SESSION_SECRET
3. Create PostgreSQL database (Replit built-in)
4. Enable OpenAI integration (Replit built-in)
5. Implement database schema with Drizzle
6. Build Express API routes
7. Create React Native screens
8. Test locally with Expo Go
9. Deploy to production
10. Configure Twilio webhooks to point to deployed URL

---

This prompt contains everything needed to recreate the WorkMate AI Agent application with full functionality.
