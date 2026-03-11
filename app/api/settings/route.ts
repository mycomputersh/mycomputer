import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { orgSettings } from "@/db/settings-schema"
import type { ProviderConfigs } from "@/db/settings-schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const organizationId = session.session.activeOrganizationId
  if (!organizationId)
    return new Response("No active organization", { status: 400 })

  const rows = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.organizationId, organizationId))
    .limit(1)

  return Response.json(rows[0] ?? null)
}

export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const organizationId = session.session.activeOrganizationId
  if (!organizationId)
    return new Response("No active organization", { status: 400 })

  const body = await req.json()
  const providerConfigs: ProviderConfigs = body.providerConfigs ?? {}

  const values = {
    organizationId,
    providerConfigs: JSON.stringify(providerConfigs),
    updatedAt: new Date(),
  }

  await db
    .insert(orgSettings)
    .values(values)
    .onConflictDoUpdate({
      target: orgSettings.organizationId,
      set: {
        providerConfigs: values.providerConfigs,
        updatedAt: values.updatedAt,
      },
    })

  return Response.json({ success: true })
}
