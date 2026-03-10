import { type InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai"
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

const instructions = `You are a capable AI assistant with access to a powerful set of tools.

You can:
- **Search the web** to find up-to-date information
- **Run code** in Python, JavaScript, TypeScript, or Bash
- **Manage memory** — store and recall information persistently using semantic search
- **Plan workflows** — create structured step-by-step plans before tackling complex tasks
- **Spawn subagents** — delegate heavy subtasks (research, coding, analysis) to specialized agents
- **Manage files** — read, write, and list files in the workspace

## Guidelines
- For complex multi-step tasks, start with \`createPlan\` to outline your approach, then use \`updateStepStatus\` as you progress
- Use \`memoryStore\` to save important information you'll need later, and \`memoryRecall\` to retrieve it semantically
- Use \`memoryForget\` to delete outdated or incorrect memories
- When a task requires deep research or focused coding, delegate to a subagent via \`spawnSubagent\`
- Combine tools creatively — e.g., search → analyze → write code → run code
- Be transparent about what you're doing at each step`

export function createMainAgent(organizationId: string) {
  const { memoryStoreTool, memoryRecallTool, memoryForgetTool } =
    createMemoryTools(organizationId)

  return new ToolLoopAgent({
    model: geminiModel,
    stopWhen: stepCountIs(30),
    instructions,
    tools: {
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
    },
  })
}

// Reference instance for type inference only
const _ref = createMainAgent("__type_ref__")
export type AgentUIMessage = InferAgentUIMessage<typeof _ref>
