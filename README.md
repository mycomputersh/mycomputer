# Computer Agent

A full-stack AI agent platform built with Next.js. Chat with a multi-tool agent that can search the web, run code, manage files, store memories, plan workflows, and delegate tasks to subagents. Supports multiple AI providers and extends with MCP servers.

## Screenshots

![Chat view showing a research workflow plan on quantum computing](docs/images/image2.jpeg)

![Marketplace showing built-in tools](docs/images/image1.jpeg)

## Features

- **Multi-model support** — Google Gemini, OpenAI, Anthropic, Groq, Mistral, Ollama
- **Built-in tools** — web search, code execution, file system, semantic memory, workflow planner, subagents
- **MCP integration** — connect any Model Context Protocol server to extend agent capabilities
- **Marketplace** — install/uninstall tools per organization
- **Organizations & teams** — multi-tenant with roles, invitations, and per-org settings
- **LLM telemetry** — trace every call with token counts, latency, and tool usage
- **Persistent chat** — conversations saved to PostgreSQL with folder organization

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **AI:** Vercel AI SDK v6 (`ToolLoopAgent`, streaming, MCP)
- **Database:** PostgreSQL + Drizzle ORM (Neon-compatible)
- **Auth:** Better Auth (email/password + Google OAuth, organizations)
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Memory:** pgvector for semantic similarity search

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))
- At least one AI provider API key

### 1. Clone and install

```bash
git clone <repo-url>
cd computer-agent
npm install
```

### 2. Configure environment

Copy and fill in the environment variables:

```bash
cp .env.example .env
```

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/computer_agent

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Providers — add whichever you want to use
GOOGLE_GENERATIVE_AI_API_KEY=
```

Additional provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`) can be configured per-organization in the Settings page after signup.

### 3. Set up the database

```bash
npm run db:push
```

This applies the Drizzle schema to your PostgreSQL database, including the `pgvector` extension required for semantic memory.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up to get started.

## Built-in Tools

Tools are installed per organization from the **Marketplace** page:

| Tool | Description |
|------|-------------|
| **Web Search** | Real-time search + automatic page fetching for full content |
| **Code Runner** | Execute Python, JavaScript, TypeScript, or Bash in a sandbox |
| **Semantic Memory** | Store and recall information using vector similarity search |
| **File System** | Read, write, and list files in a virtual workspace |
| **Workflow Planner** | Create step-by-step plans and track progress |
| **Subagents** | Spawn specialized agents to handle focused subtasks in parallel |

## MCP Servers

Connect any [Model Context Protocol](https://modelcontextprotocol.io) server from the Marketplace page. Enter the server URL and it will be available as tools in the agent.

## Project Structure

```
app/
  (auth)/           # Login / signup pages
  (dashboard)/
    dashboard/
      chat/         # Chat pages (new + existing)
      marketplace/  # Tool & MCP server management
      settings/     # Provider API keys, team members
api/
  auth/             # Better Auth handler
  chat/             # Main agent streaming endpoint
  chats/            # Chat CRUD
  folders/          # Chat folder CRUD
  marketplace/      # Tool install/uninstall, MCP servers
  settings/         # Provider config
  traces/           # LLM telemetry

components/
  ai-elements/      # Conversation, Message, PromptInput, Tool UI primitives
  tool-renderers/   # Per-tool result displays
  dashboard-sidebar/

lib/
  agents/           # ToolLoopAgent setup and instructions
  tools/            # Tool implementations
  models.ts         # Provider config and model creation

db/                 # Drizzle schemas
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Biome lint check
npm run format       # Biome format
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Deployment

The app works on any Node.js host. For Vercel:

1. Set all environment variables in project settings
2. Ensure your `DATABASE_URL` points to a serverless-compatible PostgreSQL (e.g. Neon)
3. Deploy — the API routes have `maxDuration: 60` set for long-running agent calls
