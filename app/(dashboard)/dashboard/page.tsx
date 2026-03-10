import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const orgsResult = await auth.api.listOrganizations({
    headers: await headers(),
  })
  const organizations = orgsResult ?? []
  const activeOrg =
    organizations.find((o) => o.id === session.session.activeOrganizationId) ??
    organizations[0]

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {session.user.name}.
        </p>
      </div>

      {activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Name</span>
              <span className="font-medium">{activeOrg.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Slug</span>
              <Badge variant="secondary">{activeOrg.slug}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No organizations yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{org.name}</span>
                  <Badge variant="outline">{org.slug}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
