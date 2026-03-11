import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { installedTools } from "@/db/marketplace-schema"
import { orgSettings } from "@/db/settings-schema"
import { resolveEnabledTools } from "@/lib/marketplace"
import { createMainAgent } from "@/lib/agents/main-agent"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const organizationId = session?.session.activeOrganizationId ?? "personal"

  const [installed, settingsRow] = await Promise.all([
    db
      .select({ itemId: installedTools.itemId })
      .from(installedTools)
      .where(eq(installedTools.organizationId, organizationId)),
    db
      .select()
      .from(orgSettings)
      .where(eq(orgSettings.organizationId, organizationId))
      .limit(1),
  ])

  const enabledToolNames = resolveEnabledTools(installed.map((r) => r.itemId))
  const settings = settingsRow[0] ?? null

  const { messages }: { messages: UIMessage[] } = await req.json()

  return createAgentUIStreamResponse({
    agent: createMainAgent(organizationId, enabledToolNames, settings),
    uiMessages: messages,
  })
}
