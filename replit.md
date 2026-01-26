# WorkMate AI Agent

## Overview

WorkMate AI Agent is a multi-tenant SaaS mobile application built with React Native (Expo) that provides businesses with AI-powered voice call automation. The app serves as a "virtual employee" handling voice calls with AI-driven responses and automation.

The application features a premium, cinematic design with liquid glass aesthetics, animated backgrounds with gradient orbs, and frosted glass UI components. It supports iOS, Android, and Web platforms through Expo's cross-platform capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack and bottom tab navigators
- **State Management**: TanStack React Query for server state
- **Animations**: React Native Reanimated for smooth, declarative animations
- **UI Components**: Custom glass morphism components with blur effects using expo-blur
- **Design System**: Dark-themed with primary blue (#135bec), deep navy background (#101622), and glass panel overlays

### Backend Architecture
- **Runtime**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Development Server**: Uses tsx for TypeScript execution
- **Production Build**: esbuild bundles server code to ESM format

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Generated in `./migrations` directory via drizzle-kit
- **Current Storage**: MemStorage class for in-memory data

### API Integration Status
- **AgentsScreen**: Fetches agents from `/api/businesses/:id/agents`, shows loading/empty states
- **InboxScreen**: Fetches conversations from `/api/businesses/:id/conversations`, supports Active/Transferred/Resolved filters
- **DashboardScreen**: Fetches business stats from `/api/businesses/:id/stats`
- **BusinessContext**: Manages current business state with AsyncStorage persistence

### Project Structure
- `client/` - React Native application code
  - `components/` - Reusable UI components (GlassCard, Button, StatCard, etc.)
  - `screens/` - Screen components (Dashboard, Inbox, Agents, Settings)
  - `navigation/` - Navigation configuration
  - `hooks/` - Custom React hooks
  - `constants/` - Theme and design tokens
  - `lib/` - Utility functions and API client
- `server/` - Express backend
- `shared/` - Shared types and schemas between client/server
- `assets/` - Images and static assets

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

## External Dependencies

### Core Services (Planned/Documented)
- **AI/LLM**: OpenAI GPT-4 for conversation AI, Whisper for voice transcription
- **Voice**: Twilio for phone number provisioning and call handling
- **Messaging**: Twilio SMS, Meta Graph API (Instagram/Facebook), WhatsApp Business API
- **Payments**: Stripe for subscriptions and usage-based billing
- **Push Notifications**: Expo Notifications

### Current Integrations
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Fonts**: Google Fonts (Inter family via web CDN in design specs)
- **Icons**: Expo Vector Icons (Feather icon set)

### Phone Number Options
- **Twilio Numbers**: Purchase directly in-app, webhooks auto-configured
- **Bring Your Own Number (BYON)**: Add existing Twilio numbers (auto-configured) or personal numbers (require call forwarding setup)
- **Call Forwarding**: For personal/carrier numbers, users forward calls to a WorkMate Twilio number

### Development Environment
- **EXPO_PUBLIC_DOMAIN**: Required for API URL configuration
- **REPLIT_DEV_DOMAIN**: Used for development server proxying
- **DATABASE_URL**: PostgreSQL connection string