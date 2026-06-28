# Antigravity

An AI-powered productivity companion that locks distracting apps and rewards task completion with screen time tokens.

## Architecture

- **Mobile**: React Native (Expo) with Expo Router
- **Backend**: Node.js with Express
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Hybrid — Gemini/Claude for reasoning, local models for fast parsing
- **Native**: Custom Expo modules for Android app monitoring

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Supabase CLI (`npm install -g supabase`)

### Setup

```bash
# Install dependencies
npm install

# Start the backend
npm run dev:backend

# Start the mobile app
npm run dev:mobile
```

### Project Structure

```
antigravity/
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   └── backend/         # Node.js API server
├── packages/
│   └── shared/          # Shared types, validators, constants
├── docs/                # Architecture documentation
├── turbo.json           # Turborepo config
└── package.json         # Root workspace
```

## Key Features

1. **Intelligent Task Breakdown**: AI splits large tasks into 5-15 minute micro-tasks
2. **The Vault & App Intercept**: OS-level app locking with overlay interception
3. **Token Economy**: Earn tokens by completing tasks, spend them on screen time
4. **Autonomous Scheduling**: AI time-blocks tasks into your calendar
5. **Voice Brain-Dump**: Speak tasks, AI parses and schedules them
6. **Context-Aware Reminders**: Smart nudges during detected free time
7. **Goal & Habit Tracking**: Long-term objective tracking with streak mechanics
