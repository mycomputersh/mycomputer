import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chatFolders } from "@/db/chat-schema"

async function getOwnedFolder(folderId: string, orgId: string) {
  const rows = await db
    .select()
    .from(chatFolders)
    .where(
      and(eq(chatFolders.id, folderId), eq(chatFolders.organizationId, orgId)),
    )
    .limit(1)
  return rows[0] ?? null
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { id } = await params
  const folder = await getOwnedFolder(id, orgId)
  if (!folder) return new Response("Not Found", { status: 404 })

  const { name } = await req.json()
  if (!name?.trim()) return new Response("Name required", { status: 400 })

  await db
    .update(chatFolders)
    .set({ name: name.trim() })
    .where(eq(chatFolders.id, id))

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
  const folder = await getOwnedFolder(id, orgId)
  if (!folder) return new Response("Not Found", { status: 404 })

  // chats in this folder have folderId set to null via ON DELETE SET NULL
  await db.delete(chatFolders).where(eq(chatFolders.id, id))

  return Response.json({ ok: true })
}
