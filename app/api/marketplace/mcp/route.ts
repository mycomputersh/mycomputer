import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { mcpServers } from "@/db/mcp-schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const orgId = session.session.activeOrganizationId ?? "personal"
  const rows = await db
    .select()
    .from(mcpServers)
    .where(eq(mcpServers.organizationId, orgId))

  return Response.json(rows)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { name, url } = await req.json()
  if (!name || !url) return new Response("name and url are required", { status: 400 })

  const orgId = session.session.activeOrganizationId ?? "personal"

  const [row] = await db
    .insert(mcpServers)
    .values({ id: nanoid(), organizationId: orgId, name, url })
    .returning()

  return Response.json(row)
}
