import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { installedTools } from "@/db/marketplace-schema"
import { MARKETPLACE_ITEMS } from "@/lib/marketplace"
import { MarketplaceGrid } from "@/components/marketplace-grid"

export default async function MarketplacePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const orgId = session?.session.activeOrganizationId ?? "personal"

  const installed = await db
    .select({ itemId: installedTools.itemId })
    .from(installedTools)
    .where(eq(installedTools.organizationId, orgId))

  const installedIds = new Set(installed.map((r) => r.itemId))

  const items = MARKETPLACE_ITEMS.map((item) => ({
    ...item,
    installed: installedIds.has(item.id),
  }))

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tool Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Install tools to extend your agent&apos;s capabilities.
        </p>
      </div>
      <MarketplaceGrid items={items} />
    </div>
  )
}
