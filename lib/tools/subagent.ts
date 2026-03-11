import {
  readUIMessageStream,
  stepCountIs,
  ToolLoopAgent,
  tool,
  type LanguageModel,
  type UIMessage,
  type UIToolInvocation,
} from "ai"
import { z } from "zod"
import { geminiModel } from "../models"
import { codeRunnerTool } from "./code-runner"
import { readFileTool, writeFileTool } from "./file-ops"
import { webSearchTool } from "./web-search"

// ─── Tool factory ─────────────────────────────────────────────────────────────

export function createSubagentTool(model: LanguageModel) {
  const researchSubagent = new ToolLoopAgent({
    model,
    stopWhen: stepCountIs(10),
    instructions: `You are a focused research agent. Research the given topic thoroughly.
When finished, write a clear structured summary of your findings as your final response.
This summary is returned to the main agent, so make it comprehensive but concise.`,
    tools: { webSearch: webSearchTool },
  })

  const coderSubagent = new ToolLoopAgent({
    model,
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
    model,
    stopWhen: stepCountIs(10),
    instructions: `You are a focused analysis agent. Analyze the given topic, use tools for data/context,
and produce a structured analytical report with key metrics and recommendations.`,
    tools: { webSearch: webSearchTool, runCode: codeRunnerTool },
  })

  const summarizerSubagent = new ToolLoopAgent({
    model,
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

  return tool({
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
    toModelOutput: ({ output }) => {
      const msg = output as UIMessage | undefined
      const lastTextPart = msg?.parts.findLast((p) => p.type === "text")
      return {
        type: "text" as const,
        value: lastTextPart?.text ?? "Subagent task completed.",
      }
    },
  })
}

// Static reference for backward compat and type inference
export const spawnSubagentTool = createSubagentTool(geminiModel)
export type SpawnSubagentInvocation = UIToolInvocation<typeof spawnSubagentTool>
