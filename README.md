# Cue

A minimalist AI-powered task manager that intuitively processes natural language to organize your day. Simply type what you need, and let AI handle the rest.

## Features

- AI-powered task intelligence: Create, edit, schedule, prioritize, sort, and complete tasks using natural language
- Privacy-focused with local storage (IndexedDB)
- PWA with offline support
- Minimalistic dark themed UI
- Keyboard shortcuts
- Swipe gestures on mobile
- Device sync via JSON export/import
- Customizable settings

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **AI Models**: Claude, Llama, Grok, Qwen via [ai-sdk](https://github.com/vercel/ai)
- **UI**: [TailwindCSS](https://tailwindcss.com/)
- **State**: Local with [IndexedDB](https://dexie.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## AI Capabilities

Cue understands natural language commands for task management:

- **Intelligent Creation**: "Add team meeting tomorrow at 3pm with high priority"
- **Smart Editing**: "Move my dentist appointment to Friday at 2pm"
- **Quick Actions**: "Mark gym session as complete" or "Delete yesterday's tasks"
- **Bulk Processing**: "Add buy groceries today and schedule dentist for next Friday"
- **Time Understanding**: Automatically converts time references (2pm, morning, etc.)
- **Date Parsing**: Handles relative dates (today, tomorrow, next week)
- **Priority Recognition**: Identifies importance levels from your language

## Getting Started

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

## Environment Setup

Create a `.env.local` file with:

```
# Only ONE of these API keys is needed based on model preference
OPENAI_API_KEY=sk-proj-your-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
GROQ_API_KEY=your-groq-api-key-here

NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=cue # Optional
```

## Development

```bash
# Lint code
npm run lint

# Type check
npm run tc

# Build for production
npm run build
```

## License

MIT