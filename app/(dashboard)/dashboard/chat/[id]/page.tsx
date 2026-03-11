import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chats } from "@/db/chat-schema"
import { orgSettings } from "@/db/settings-schema"
import type { ProviderConfigs } from "@/db/settings-schema"
import { buildAvailableModels } from "@/lib/available-models"
import { ChatView } from "@/components/chat-view"
import type { UIMessage } from "ai"

export default async function ExistingChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const orgId = session?.session.activeOrganizationId ?? "personal"

  const [chatRows, settingsRows] = await Promise.all([
    db.select().from(chats).where(eq(chats.id, id)).limit(1),
    db.select().from(orgSettings).where(eq(orgSettings.organizationId, orgId)).limit(1),
  ])

  const chat = chatRows[0]
  if (!chat || chat.organizationId !== orgId) notFound()

  const providerConfigs: ProviderConfigs = settingsRows[0]?.providerConfigs
    ? JSON.parse(settingsRows[0].providerConfigs)
    : {}

  return (
    <ChatView
      key={id}
      chatId={id}
      initialMessages={(chat.messages ?? []) as UIMessage[]}
      initialError={chat.lastError ?? null}
      availableModels={buildAvailableModels(providerConfigs)}
    />
  )
}
