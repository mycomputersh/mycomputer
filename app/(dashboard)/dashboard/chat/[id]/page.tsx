import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chats } from "@/db/chat-schema"
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

  const rows = await db.select().from(chats).where(eq(chats.id, id)).limit(1)
  const chat = rows[0]
  if (!chat || chat.organizationId !== orgId) notFound()

  return (
    <ChatView
      chatId={id}
      initialMessages={(chat.messages ?? []) as UIMessage[]}
      initialError={chat.lastError ?? null}
    />
  )
}
