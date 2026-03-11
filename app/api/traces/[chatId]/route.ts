import { asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { llmTraces } from "@/db/telemetry-schema"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { chatId } = await params
  const organizationId = session.session.activeOrganizationId ?? "personal"

  const traces = await db
    .select()
    .from(llmTraces)
    .where(eq(llmTraces.chatId, chatId))
    .orderBy(asc(llmTraces.createdAt))

  // Guard: only return traces that belong to this org
  const filtered = traces.filter((t) => t.organizationId === organizationId)

  return Response.json(filtered)
}
