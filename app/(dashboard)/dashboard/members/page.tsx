import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { RemoveMemberButton } from "@/components/remove-member-button"
import { auth } from "@/lib/auth"

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const activeOrgId = session.session.activeOrganizationId
  if (!activeOrgId) redirect("/dashboard")

  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: activeOrgId },
  })
  if (!org) redirect("/dashboard")

  const currentMember = org.members.find((m) => m.userId === session.user.id)
  const canManage =
    currentMember?.role === "owner" || currentMember?.role === "admin"

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">{org.name}</p>
        </div>
        {canManage && <InviteMemberDialog organizationId={activeOrgId} />}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {canManage && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.email}
                </TableCell>
                <TableCell>
                  <RoleBadge role={member.role} />
                </TableCell>
                {canManage && (
                  <TableCell>
                    {member.userId !== session.user.id &&
                      member.role !== "owner" && (
                        <RemoveMemberButton
                          memberId={member.id}
                          memberName={member.user.name}
                        />
                      )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {org.invitations.filter((i) => i.status === "pending").length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium text-sm">Pending invitations</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.invitations
                  .filter((i) => i.status === "pending")
                  .map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={inv.role ?? "member"} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
  }
  return <Badge variant={variants[role] ?? "outline"}>{role}</Badge>
}
