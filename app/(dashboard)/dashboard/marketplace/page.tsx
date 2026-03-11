import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { installedTools } from "@/db/marketplace-schema"
import { mcpServers } from "@/db/mcp-schema"
import { MARKETPLACE_ITEMS } from "@/lib/marketplace"
import { MarketplaceGrid } from "@/components/marketplace-grid"

export default async function MarketplacePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const orgId = session?.session.activeOrganizationId ?? "personal"

  const [installed, installedMcpServers] = await Promise.all([
    db
      .select({ itemId: installedTools.itemId })
      .from(installedTools)
      .where(eq(installedTools.organizationId, orgId)),
    db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.organizationId, orgId)),
  ])

  const installedIds = new Set(installed.map((r) => r.itemId))
  const items = MARKETPLACE_ITEMS.map((item) => ({
    ...item,
    installed: installedIds.has(item.id),
  }))

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xs font-semibold">Marketplace</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Install built-in tools or connect MCP servers to extend your agent&apos;s capabilities.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <MarketplaceGrid items={items} initialMcpServers={installedMcpServers} />
      </div>
    </div>
  )
}
