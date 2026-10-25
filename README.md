# Charlie UI

Next.js chat UI for [@jbcbdse/charlie](https://github.com/jbcbdse/charlie).

## What it is

Charlie UI is a web chat app built on the charlie library. The user picks a model from Bedrock, OpenAI, xAI, Google, or Ollama, and the app runs it through a charlie agent. Replies stream to the browser as NDJSON. The agent can call local tools (calculator, current time, letter count) and HTTP MCP servers that the user adds in the settings dialog. The app stores chats, messages, and user settings in MongoDB.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS
- MongoDB 7 (run with Docker Compose)
- `@jbcbdse/charlie-*` packages: core, bedrock, openai, google, ollama, mcp
- Vitest for unit tests, Playwright for e2e and smoke tests

## Project layout

- `src/app/chat`: chat pages
- `src/app/components`: UI components
- `src/app/api`: thin route handlers for chats, messages, and settings
- `src/lib`: agents, chat storage, stream encoding, MCP config, system prompts
- `src/lib/tools`: local tools for the agent
- `src/types`: shared type declarations
- `e2e`: Playwright UI tests and live provider smoke tests

## Setup

1. Copy `.env.example` to `.env` and fill in provider keys (`OPENAI_API_KEY`, AWS creds/profile for Bedrock, `XAI_API_KEY`, `GOOGLE_API_KEY`, optional `OLLAMA_BASE_URL`). `MONGODB_URI` is required. `.env.example` points it at the local Docker database.
2. Authenticate to GitHub Packages so `@jbcbdse/charlie-*` installs:

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # needs read:packages
npm install
```

3. Start MongoDB: `docker compose up -d`
4. (Optional) Start local Ollama: `~/ollama/start.sh`

## Run

```bash
npm run dev
```

Open [http://localhost:3000/chat](http://localhost:3000/chat).

## Tests

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright UI tests (uses port 3010)
npm run test:smoke    # Live Ollama/OpenAI when available
npm run lint
npm run build
```
