import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chatFolders } from "@/db/chat-schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"

  const rows = await db
    .select()
    .from(chatFolders)
    .where(eq(chatFolders.organizationId, orgId))
    .orderBy(chatFolders.createdAt)

  return Response.json(rows)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const { name } = await req.json()
  if (!name?.trim()) return new Response("Name required", { status: 400 })

  const id = nanoid()
  await db.insert(chatFolders).values({
    id,
    organizationId: orgId,
    userId: session.user.id,
    name: name.trim(),
  })

  return Response.json({ id, name: name.trim() })
}
