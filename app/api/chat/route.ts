import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { installedTools } from "@/db/marketplace-schema"
import { resolveEnabledTools } from "@/lib/marketplace"
import { createMainAgent } from "@/lib/agents/main-agent"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const organizationId = session?.session.activeOrganizationId ?? "personal"

  // Load which tools this org has installed
  const installed = await db
    .select({ itemId: installedTools.itemId })
    .from(installedTools)
    .where(eq(installedTools.organizationId, organizationId))

  const enabledToolNames = resolveEnabledTools(installed.map((r) => r.itemId))

  const { messages }: { messages: UIMessage[] } = await req.json()

  return createAgentUIStreamResponse({
    agent: createMainAgent(organizationId, enabledToolNames),
    uiMessages: messages,
  })
}
