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

function classifyError(err: unknown): { status: number; message: string } {
  if (!(err instanceof Error)) {
    return { status: 500, message: "An unexpected error occurred." }
  }

  const msg = err.message.toLowerCase()
  const cause = (err as { cause?: unknown }).cause
  const causeMsg = cause instanceof Error ? cause.message.toLowerCase() : ""
  const isRateLimit =
    msg.includes("too many requests") ||
    msg.includes("rate limit") ||
    causeMsg.includes("too many requests") ||
    causeMsg.includes("rate limit") ||
    (err as { statusCode?: number }).statusCode === 429

  if (isRateLimit) {
    return {
      status: 429,
      message: "Rate limit reached. Please wait a moment and try again.",
    }
  }

  if (
    msg.includes("unauthorized") ||
    msg.includes("invalid api key") ||
    (err as { statusCode?: number }).statusCode === 401
  ) {
    return {
      status: 401,
      message: "Invalid API key. Please check your settings.",
    }
  }

  return { status: 500, message: err.message || "An unexpected error occurred." }
}

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

  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await req.json()

  try {
    return await createAgentUIStreamResponse({
      agent: createMainAgent(organizationId, enabledToolNames, settings, {
        chatId: chatId ?? null,
        organizationId,
      }),
      uiMessages: messages,
    })
  } catch (err) {
    const { status, message } = classifyError(err)
    return Response.json({ error: message }, { status })
  }
}
