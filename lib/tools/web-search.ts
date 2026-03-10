import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"

export const webSearchTool = tool({
  description: "Search the web for information on a topic or question.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Number of results to return"),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    // Mock implementation
    await new Promise((r) => setTimeout(r, 800))
    return {
      query,
      results: Array.from({ length: maxResults }, (_, i) => ({
        title: `Result ${i + 1} for "${query}"`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `This is a mock search result snippet for the query "${query}". It contains relevant information about the topic.`,
      })),
      totalResults: 1_200_000,
    }
  },
})

export type WebSearchInvocation = UIToolInvocation<typeof webSearchTool>
