import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chats } from "@/db/chat-schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"

  const rows = await db
    .select({
      id: chats.id,
      title: chats.title,
      folderId: chats.folderId,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.organizationId, orgId))
    .orderBy(desc(chats.updatedAt))

  return Response.json(rows)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { title } = await req.json()

  const id = nanoid()
  await db.insert(chats).values({
    id,
    organizationId: orgId,
    userId: session.user.id,
    title: title || "New Chat",
    messages: [],
  })

  return Response.json({ id })
}
