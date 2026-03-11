import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { mcpServers } from "@/db/mcp-schema"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const orgId = session.session.activeOrganizationId ?? "personal"

  await db
    .delete(mcpServers)
    .where(and(eq(mcpServers.organizationId, orgId), eq(mcpServers.id, id)))

  return Response.json({ ok: true })
}
