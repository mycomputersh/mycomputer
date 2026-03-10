import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"

// In-memory virtual filesystem
const vfs = new Map<string, { content: string; updatedAt: string }>()

export const writeFileTool = tool({
  description: "Write or overwrite a file in the virtual workspace.",
  inputSchema: z.object({
    path: z.string().describe("File path (e.g. src/index.ts)"),
    content: z.string().describe("File content"),
  }),
  execute: async ({ path, content }) => {
    vfs.set(path, { content, updatedAt: new Date().toISOString() })
    return { success: true, path, bytesWritten: content.length }
  },
})

export const readFileTool = tool({
  description: "Read a file from the virtual workspace.",
  inputSchema: z.object({
    path: z.string().describe("File path to read"),
  }),
  execute: async ({ path }) => {
    const entry = vfs.get(path)
    if (!entry) return { found: false, path }
    return {
      found: true,
      path,
      content: entry.content,
      updatedAt: entry.updatedAt,
    }
  },
})

export const listFilesTool = tool({
  description: "List all files in the virtual workspace.",
  inputSchema: z.object({
    prefix: z.string().optional().describe("Optional path prefix to filter by"),
  }),
  execute: async ({ prefix }) => {
    const paths = Array.from(vfs.keys()).filter(
      (k) => !prefix || k.startsWith(prefix),
    )
    return { files: paths, count: paths.length }
  },
})

export type WriteFileInvocation = UIToolInvocation<typeof writeFileTool>
export type ReadFileInvocation = UIToolInvocation<typeof readFileTool>
export type ListFilesInvocation = UIToolInvocation<typeof listFilesTool>
