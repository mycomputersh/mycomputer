import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { orgSettings } from "@/db/settings-schema"
import type { ProviderConfigs } from "@/db/settings-schema"
import { SettingsTabs } from "@/components/settings-tabs"

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) redirect("/dashboard")

  const [settingsRows, org] = await Promise.all([
    db
      .select()
      .from(orgSettings)
      .where(eq(orgSettings.organizationId, organizationId))
      .limit(1),
    auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId },
    }),
  ])

  if (!org) redirect("/dashboard")

  const row = settingsRows[0] ?? null
  const providerConfigs: ProviderConfigs = row?.providerConfigs
    ? JSON.parse(row.providerConfigs)
    : {}

  const currentMember = org.members.find((m) => m.userId === session.user.id)
  const canManage =
    currentMember?.role === "owner" || currentMember?.role === "admin"

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center border-b px-4">
        <h1 className="text-xs font-semibold">Settings</h1>
      </header>

      <SettingsTabs
        providerConfigs={providerConfigs}
        org={org}
        currentUserId={session.user.id}
        canManage={canManage}
        organizationId={organizationId}
      />
    </div>
  )
}
