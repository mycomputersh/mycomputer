import { type InferAgentUIMessage, stepCountIs, ToolLoopAgent, type ToolSet } from "ai"
import { codeRunnerTool } from "@/lib/tools/code-runner"
import { fetchPageTool } from "@/lib/tools/fetch-page"
import {
  listFilesTool,
  readFileTool,
  writeFileTool,
} from "@/lib/tools/file-ops"
import { createMemoryTools } from "@/lib/tools/memory"
import { registerSourcesTool } from "@/lib/tools/sources"
import { createSubagentTool } from "@/lib/tools/subagent"
import { webSearchTool } from "@/lib/tools/web-search"
import { createPlanTool, updateStepStatusTool } from "@/lib/tools/workflow"
import { createLanguageModel, geminiModel } from "../models"
import type { OrgSettings } from "@/db/settings-schema"
import type { TelemetryContext } from "@/lib/middleware/telemetry"

const instructions = `You are a capable AI assistant with access to a set of tools chosen by the user.

## Guidelines
- For complex multi-step tasks, start with \`createPlan\` to outline your approach, then use \`updateStepStatus\` as you progress
- Use \`memoryStore\` to save important information you'll need later, and \`memoryRecall\` to retrieve it semantically
- Use \`memoryForget\` to delete outdated or incorrect memories
- When a task requires deep research or focused coding, delegate to a subagent via \`spawnSubagent\`
- Combine tools creatively — e.g., search → analyze → write code → run code
- Only use tools that are available to you
- Be transparent about what you're doing at each step

## Citations
- Whenever you summarize, reference, or quote content from web searches or fetched pages, you MUST call \`registerSources\` first with every source you will cite
- Then use [1], [2], … markers inline in your response to reference those sources
- Every [n] marker must match a source registered in the same \`registerSources\` call
- Do not use citation markers without first calling \`registerSources\``

// All available tool names
export const ALL_TOOL_NAMES = [
  "webSearch",
  "fetchPage",
  "registerSources",
  "runCode",
  "memoryStore",
  "memoryRecall",
  "memoryForget",
  "createPlan",
  "updateStepStatus",
  "spawnSubagent",
  "writeFile",
  "readFile",
  "listFiles",
] as const

export type ToolName = (typeof ALL_TOOL_NAMES)[number]

export function createMainAgent(
  organizationId: string,
  enabledToolNames: string[] = [...ALL_TOOL_NAMES],
  settings: OrgSettings | null = null,
  telemetry?: TelemetryContext,
) {
  const model = createLanguageModel(settings, telemetry)
  const { memoryStoreTool, memoryRecallTool, memoryForgetTool } =
    createMemoryTools(organizationId, settings)

  const allTools: ToolSet = {
    webSearch: webSearchTool,
    fetchPage: fetchPageTool,
    registerSources: registerSourcesTool,
    runCode: codeRunnerTool,
    memoryStore: memoryStoreTool,
    memoryRecall: memoryRecallTool,
    memoryForget: memoryForgetTool,
    createPlan: createPlanTool,
    updateStepStatus: updateStepStatusTool,
    spawnSubagent: createSubagentTool(model),
    writeFile: writeFileTool,
    readFile: readFileTool,
    listFiles: listFilesTool,
  }

  const enabled = new Set(enabledToolNames)
  const tools = Object.fromEntries(
    Object.entries(allTools).filter(([key]) => enabled.has(key)),
  )

  return new ToolLoopAgent({
    model,
    stopWhen: stepCountIs(30),
    instructions,
    tools,
  })
}

// Type-inference reference — always includes all tools so AgentUIMessage covers every tool part type
const _ref = createMainAgent("__type_ref__", [...ALL_TOOL_NAMES], null)
export type AgentUIMessage = InferAgentUIMessage<typeof _ref>
