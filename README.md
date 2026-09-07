# Charlie UI

Next.js chat UI for [@jbcbdse/charlie](https://github.com/jbcbdse/charlie).

## Setup

1. Copy `.env.example` to `.env` and fill in provider keys (`OPENAI_API_KEY`, AWS creds/profile for Bedrock, `XAI_API_KEY`, `GOOGLE_API_KEY`, optional `OLLAMA_BASE_URL`).
2. Authenticate to GitHub Packages so `@jbcbdse/charlie-*` installs:

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # needs read:packages
npm install
```

3. (Optional) Start local Ollama: `~/ollama/start.sh`

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
