import { type InferAgentUIMessage, stepCountIs, ToolLoopAgent, type ToolSet } from "ai"
import { codeRunnerTool } from "@/lib/tools/code-runner"
import {
  listFilesTool,
  readFileTool,
  writeFileTool,
} from "@/lib/tools/file-ops"
import { createMemoryTools } from "@/lib/tools/memory"
import { spawnSubagentTool } from "@/lib/tools/subagent"
import { webSearchTool } from "@/lib/tools/web-search"
import { createPlanTool, updateStepStatusTool } from "@/lib/tools/workflow"
import { geminiModel } from "../models"

const instructions = `You are a capable AI assistant with access to a set of tools chosen by the user.

## Guidelines
- For complex multi-step tasks, start with \`createPlan\` to outline your approach, then use \`updateStepStatus\` as you progress
- Use \`memoryStore\` to save important information you'll need later, and \`memoryRecall\` to retrieve it semantically
- Use \`memoryForget\` to delete outdated or incorrect memories
- When a task requires deep research or focused coding, delegate to a subagent via \`spawnSubagent\`
- Combine tools creatively — e.g., search → analyze → write code → run code
- Only use tools that are available to you
- Be transparent about what you're doing at each step`

// All available tool names
export const ALL_TOOL_NAMES = [
  "webSearch",
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
) {
  const { memoryStoreTool, memoryRecallTool, memoryForgetTool } =
    createMemoryTools(organizationId)

  const allTools: ToolSet = {
    webSearch: webSearchTool,
    runCode: codeRunnerTool,
    memoryStore: memoryStoreTool,
    memoryRecall: memoryRecallTool,
    memoryForget: memoryForgetTool,
    createPlan: createPlanTool,
    updateStepStatus: updateStepStatusTool,
    spawnSubagent: spawnSubagentTool,
    writeFile: writeFileTool,
    readFile: readFileTool,
    listFiles: listFilesTool,
  }

  const enabled = new Set(enabledToolNames)
  const tools = Object.fromEntries(
    Object.entries(allTools).filter(([key]) => enabled.has(key)),
  )

  return new ToolLoopAgent({
    model: geminiModel,
    stopWhen: stepCountIs(30),
    instructions,
    tools,
  })
}

// Type-inference reference — always includes all tools so AgentUIMessage covers every tool part type
const _ref = createMainAgent("__type_ref__", [...ALL_TOOL_NAMES])
export type AgentUIMessage = InferAgentUIMessage<typeof _ref>
