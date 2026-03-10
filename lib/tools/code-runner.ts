import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"

export const codeRunnerTool = tool({
  description: "Execute code in a sandboxed environment and return the output.",
  inputSchema: z.object({
    language: z
      .enum(["python", "javascript", "typescript", "bash"])
      .describe("Programming language"),
    code: z.string().describe("The code to execute"),
  }),
  execute: async ({ language, code }) => {
    // Mock implementation
    await new Promise((r) => setTimeout(r, 1200))
    const lineCount = code.split("\n").length
    return {
      language,
      stdout: `[Mock output]\nExecuted ${lineCount} line(s) of ${language} code successfully.\n> ${code.split("\n")[0]}`,
      stderr: "",
      exitCode: 0,
      durationMs: Math.floor(Math.random() * 500) + 50,
    }
  },
})

export type CodeRunnerInvocation = UIToolInvocation<typeof codeRunnerTool>
