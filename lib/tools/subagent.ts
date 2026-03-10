import {
  readUIMessageStream,
  stepCountIs,
  ToolLoopAgent,
  tool,
  type UIMessage,
  type UIToolInvocation,
} from "ai"
import { z } from "zod"
import { geminiModel } from "../models"
import { codeRunnerTool } from "./code-runner"
import { readFileTool, writeFileTool } from "./file-ops"
import { webSearchTool } from "./web-search"

// ─── Specialized subagents ───────────────────────────────────────────────────

const researchSubagent = new ToolLoopAgent({
  model: geminiModel,
  stopWhen: stepCountIs(10),
  instructions: `You are a focused research agent. Research the given topic thoroughly.
When finished, write a clear structured summary of your findings as your final response.
This summary is returned to the main agent, so make it comprehensive but concise.`,
  tools: { webSearch: webSearchTool },
})

const coderSubagent = new ToolLoopAgent({
  model: geminiModel,
  stopWhen: stepCountIs(10),
  instructions: `You are a focused coding agent. Write, run, and iterate on code.
When finished, summarize what you built and include the final code in your response.`,
  tools: {
    runCode: codeRunnerTool,
    writeFile: writeFileTool,
    readFile: readFileTool,
  },
})

const analystSubagent = new ToolLoopAgent({
  model: geminiModel,
  stopWhen: stepCountIs(10),
  instructions: `You are a focused analysis agent. Analyze the given topic, use tools for data/context,
and produce a structured analytical report with key metrics and recommendations.`,
  tools: { webSearch: webSearchTool, runCode: codeRunnerTool },
})

const summarizerSubagent = new ToolLoopAgent({
  model: geminiModel,
  stopWhen: stepCountIs(3),
  instructions: `You are a focused summarization agent. Condense the given content into a
clear structured summary with key points, action items, and conclusions.`,
  tools: {},
})

const SUBAGENTS = {
  researcher: researchSubagent,
  coder: coderSubagent,
  analyst: analystSubagent,
  summarizer: summarizerSubagent,
}

// ─── Tool definition ─────────────────────────────────────────────────────────

export const spawnSubagentTool = tool({
  description:
    "Delegate a specialized subtask to a dedicated subagent with its own context window. Use when a task requires deep focus (research, coding, analysis, summarization) without consuming the main context. The subagent streams its progress.",
  inputSchema: z.object({
    agentType: z
      .enum(["researcher", "coder", "analyst", "summarizer"])
      .describe("Type of specialized subagent to spawn"),
    task: z.string().describe("The specific task for the subagent to complete"),
    context: z
      .string()
      .optional()
      .describe("Additional context or constraints"),
  }),
  // Let TypeScript infer input types from inputSchema (no explicit annotations)
  execute: async function* ({ agentType, task, context }, { abortSignal }) {
    const agent = SUBAGENTS[agentType]
    const prompt = context ? `${task}\n\nContext: ${context}` : task

    const result = await agent.stream({ prompt, abortSignal })

    for await (const message of readUIMessageStream({
      stream: result.toUIMessageStream(),
    })) {
      yield message
    }
  },
  // Send only the final text summary to the main agent's context window
  toModelOutput: ({ output }) => {
    const msg = output as UIMessage | undefined
    const lastTextPart = msg?.parts.findLast((p) => p.type === "text")
    return {
      type: "text" as const,
      value: lastTextPart?.text ?? "Subagent task completed.",
    }
  },
})

export type SpawnSubagentInvocation = UIToolInvocation<typeof spawnSubagentTool>
