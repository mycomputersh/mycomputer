import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { orgSettings } from "@/db/settings-schema"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) redirect("/dashboard")

  const rows = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.organizationId, organizationId))
    .limit(1)

  const settings = rows[0] ?? null

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure AI providers and embedding models for your organization.
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  )
}
