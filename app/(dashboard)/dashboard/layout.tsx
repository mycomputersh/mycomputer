import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Separator } from "@/components/ui/separator"
import { OrgSwitcher } from "@/components/org-switcher"
import { UserNav } from "@/components/user-nav"
import { auth } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const orgsResult = await auth.api.listOrganizations({
    headers: await headers(),
  })
  const organizations = orgsResult ?? []

  // If user has no orgs yet, send them to onboarding
  if (organizations.length === 0) redirect("/onboarding")

  const activeOrg =
    organizations.find((o) => o.id === session.session.activeOrganizationId) ??
    organizations[0]

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
        <OrgSwitcher organizations={organizations} activeOrg={activeOrg} />
        <Separator orientation="vertical" className="h-6" />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/members"
            className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Members
          </Link>
          <Link
            href="/dashboard/chat"
            className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Chat
          </Link>
          <Link
            href="/dashboard/marketplace"
            className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Marketplace
          </Link>
        </nav>
        <div className="ml-auto">
          <UserNav
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
