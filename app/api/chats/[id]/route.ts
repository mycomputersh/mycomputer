import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chats } from "@/db/chat-schema"

async function getOwnedChat(chatId: string, orgId: string) {
  const rows = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.organizationId, orgId)))
    .limit(1)
  return rows[0] ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { id } = await params
  const chat = await getOwnedChat(id, orgId)
  if (!chat) return new Response("Not Found", { status: 404 })

  return Response.json(chat)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { id } = await params
  const chat = await getOwnedChat(id, orgId)
  if (!chat) return new Response("Not Found", { status: 404 })

  const body = await req.json()
  const updates: Partial<typeof chats.$inferInsert> = {}

  if (body.title !== undefined) updates.title = body.title
  if (body.folderId !== undefined) updates.folderId = body.folderId
  if (body.messages !== undefined) updates.messages = body.messages

  await db.update(chats).set(updates).where(eq(chats.id, id))

  return Response.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { id } = await params
  const chat = await getOwnedChat(id, orgId)
  if (!chat) return new Response("Not Found", { status: 404 })

  await db.delete(chats).where(eq(chats.id, id))

  return Response.json({ ok: true })
}
