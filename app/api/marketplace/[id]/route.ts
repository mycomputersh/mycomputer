import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { installedTools } from "@/db/marketplace-schema"
import { MARKETPLACE_ITEMS } from "@/lib/marketplace"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  if (!MARKETPLACE_ITEMS.find((item) => item.id === id))
    return new Response("Not Found", { status: 404 })

  const orgId = session.session.activeOrganizationId ?? "personal"

  await db
    .insert(installedTools)
    .values({ id: nanoid(), organizationId: orgId, itemId: id })
    .onConflictDoNothing()

  return Response.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const orgId = session.session.activeOrganizationId ?? "personal"

  await db
    .delete(installedTools)
    .where(
      and(
        eq(installedTools.organizationId, orgId),
        eq(installedTools.itemId, id),
      ),
    )

  return Response.json({ ok: true })
}
