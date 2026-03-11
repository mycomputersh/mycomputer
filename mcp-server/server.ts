import express from "express"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { z } from "zod"

// ─── Logger ───────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString()
}

const log = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[${timestamp()}] INFO  ${msg}`, meta ? JSON.stringify(meta) : ""),
  tool: (name: string, input: unknown, result: unknown, ms: number) =>
    console.log(
      `[${timestamp()}] TOOL  ${name} (${ms}ms)`,
      "\n  input :", JSON.stringify(input),
      "\n  result:", JSON.stringify(result),
    ),
  error: (msg: string, err?: unknown) =>
    console.error(`[${timestamp()}] ERROR ${msg}`, err ?? ""),
  req: (method: string, path: string, status: number, ms: number) =>
    console.log(`[${timestamp()}] HTTP  ${method} ${path} → ${status} (${ms}ms)`),
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// CORS
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (_req.method === "OPTIONS") {
    res.sendStatus(200)
    return
  }
  next()
})

// Request logger
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    // Skip noisy health checks unless they fail
    if (req.path === "/health" && res.statusCode < 400) return
    log.req(req.method, req.path, res.statusCode, Date.now() - start)
  })
  next()
})

// Track active SSE transports by session ID
const transports = new Map<string, SSEServerTransport>()

// ─── MCP Server ───────────────────────────────────────────────────────────────

function buildMcpServer() {
  const server = new McpServer({
    name: "my-computer-mcp",
    version: "1.0.0",
  })

  server.tool("get_time", "Get the current date and time in ISO 8601 format", {}, async () => {
    const start = Date.now()
    const result = { content: [{ type: "text" as const, text: new Date().toISOString() }] }
    log.tool("get_time", {}, result, Date.now() - start)
    return result
  })

  server.tool(
    "echo",
    "Echo back a message — useful for testing connectivity",
    { message: z.string().describe("The message to echo back") },
    async ({ message }) => {
      const start = Date.now()
      const result = { content: [{ type: "text" as const, text: `Echo: ${message}` }] }
      log.tool("echo", { message }, result, Date.now() - start)
      return result
    },
  )

  server.tool(
    "calculate",
    "Safely evaluate a simple arithmetic expression and return the result",
    { expression: z.string().describe("A safe arithmetic expression, e.g. '(3 + 5) * 2'") },
    async ({ expression }) => {
      const start = Date.now()
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        const result = {
          content: [{ type: "text" as const, text: "Invalid expression — only basic arithmetic is supported." }],
          isError: true,
        }
        log.tool("calculate", { expression }, result, Date.now() - start)
        return result
      }
      try {
        // biome-ignore lint/security/noGlobalEval: intentionally sandboxed arithmetic eval
        const value = eval(expression)
        const result = { content: [{ type: "text" as const, text: String(value) }] }
        log.tool("calculate", { expression }, result, Date.now() - start)
        return result
      } catch (err) {
        const result = { content: [{ type: "text" as const, text: "Failed to evaluate expression." }], isError: true }
        log.tool("calculate", { expression }, result, Date.now() - start)
        log.error("calculate eval failed", err)
        return result
      }
    },
  )

  server.tool(
    "get_system_info",
    "Return basic information about the MCP server environment",
    {},
    async () => {
      const start = Date.now()
      const info = {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: Math.round(process.uptime()),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
        },
      }
      const result = { content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }] }
      log.tool("get_system_info", {}, result, Date.now() - start)
      return result
    },
  )

  return server
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// SSE endpoint — each client gets its own server + transport
app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/messages", res)
  transports.set(transport.sessionId, transport)
  log.info("SSE client connected", { sessionId: transport.sessionId, total: transports.size })

  res.on("close", () => {
    transports.delete(transport.sessionId)
    log.info("SSE client disconnected", { sessionId: transport.sessionId, total: transports.size })
  })

  const server = buildMcpServer()
  await server.connect(transport)
})

// Message endpoint — clients POST here to send MCP requests
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string
  const transport = transports.get(sessionId)

  if (!transport) {
    log.error("Message received for unknown session", { sessionId })
    res.status(404).json({ error: "Session not found. Open /sse first." })
    return
  }

  await transport.handlePostMessage(req, res, req.body)
})

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", activeSessions: transports.size })
})

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`\n🚀 MCP Server running on http://localhost:${PORT}`)
  console.log(`   SSE endpoint : http://localhost:${PORT}/sse`)
  console.log(`   Health check : http://localhost:${PORT}/health\n`)
})
