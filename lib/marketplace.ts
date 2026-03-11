export type MarketplaceItem = {
  id: string
  title: string
  description: string
  category: string
  icon: string // lucide icon name
  tools: string[] // agent tool keys this item enables
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "web-search",
    title: "Web Search",
    description:
      "Search the internet for real-time information, news, and facts.",
    category: "Research",
    icon: "Globe",
    tools: ["webSearch", "fetchPage", "registerSources"],
  },
  {
    id: "code-runner",
    title: "Code Runner",
    description:
      "Execute Python, JavaScript, TypeScript, and Bash code in a sandboxed environment.",
    category: "Development",
    icon: "Code",
    tools: ["runCode"],
  },
  {
    id: "memory",
    title: "Semantic Memory",
    description:
      "Store and recall information across conversations using vector-based semantic search.",
    category: "Memory",
    icon: "Brain",
    tools: ["memoryStore", "memoryRecall", "memoryForget"],
  },
  {
    id: "file-system",
    title: "File System",
    description: "Read, write, and list files in the virtual workspace.",
    category: "Files",
    icon: "FolderOpen",
    tools: ["writeFile", "readFile", "listFiles"],
  },
  {
    id: "workflow",
    title: "Workflow Planner",
    description:
      "Create structured multi-step plans and track progress through complex tasks.",
    category: "Productivity",
    icon: "ListChecks",
    tools: ["createPlan", "updateStepStatus"],
  },
  {
    id: "subagents",
    title: "Subagents",
    description:
      "Spawn specialized subagents for deep research, coding, analysis, and summarization.",
    category: "AI",
    icon: "Bot",
    tools: ["spawnSubagent"],
  },
]

export function resolveEnabledTools(installedItemIds: string[]): string[] {
  const ids = new Set(installedItemIds)
  return MARKETPLACE_ITEMS.filter((item) => ids.has(item.id)).flatMap(
    (item) => item.tools,
  )
}
