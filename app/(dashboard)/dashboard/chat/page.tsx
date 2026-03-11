import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { orgSettings } from "@/db/settings-schema"
import type { ProviderConfigs } from "@/db/settings-schema"
import { buildAvailableModels } from "@/lib/available-models"
import { ChatView } from "@/components/chat-view"

export default async function NewChatPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const organizationId = session?.session.activeOrganizationId ?? "personal"

  const rows = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.organizationId, organizationId))
    .limit(1)

  const providerConfigs: ProviderConfigs = rows[0]?.providerConfigs
    ? JSON.parse(rows[0].providerConfigs)
    : {}

  return (
    <ChatView
      key="new"
      chatId={null}
      availableModels={buildAvailableModels(providerConfigs)}
    />
  )
}
