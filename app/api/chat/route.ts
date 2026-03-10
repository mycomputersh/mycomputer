import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createMainAgent } from "@/lib/agents/main-agent"

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const organizationId = session?.session.activeOrganizationId ?? "personal"

  const { messages }: { messages: UIMessage[] } = await req.json()

  return createAgentUIStreamResponse({
    agent: createMainAgent(organizationId),
    uiMessages: messages,
  })
}
