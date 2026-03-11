import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { orgSettings } from "@/db/settings-schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return new Response("No active organization", { status: 400 })

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
  if (!organizationId) return new Response("No active organization", { status: 400 })

  const body = await req.json()

  const values = {
    organizationId,
    aiProvider: body.aiProvider ?? "google",
    aiApiKey: body.aiApiKey || null,
    aiBaseUrl: body.aiBaseUrl || null,
    aiModel: body.aiModel || null,
    embeddingProvider: body.embeddingProvider ?? "google",
    embeddingModel: body.embeddingModel || null,
    embeddingApiKey: body.embeddingApiKey || null,
    embeddingBaseUrl: body.embeddingBaseUrl || null,
    updatedAt: new Date(),
  }

  await db
    .insert(orgSettings)
    .values(values)
    .onConflictDoUpdate({
      target: orgSettings.organizationId,
      set: {
        aiProvider: values.aiProvider,
        aiApiKey: values.aiApiKey,
        aiBaseUrl: values.aiBaseUrl,
        aiModel: values.aiModel,
        embeddingProvider: values.embeddingProvider,
        embeddingModel: values.embeddingModel,
        embeddingApiKey: values.embeddingApiKey,
        embeddingBaseUrl: values.embeddingBaseUrl,
        updatedAt: values.updatedAt,
      },
    })

  return Response.json({ success: true })
}
