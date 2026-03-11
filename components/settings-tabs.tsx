"use client"

import { useState } from "react"
import { KeyRound, Users } from "lucide-react"
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
import { SettingsForm } from "@/components/settings-form"
import { cn } from "@/lib/utils"
import type { OrgSettings } from "@/db/settings-schema"

type Member = {
  id: string
  userId: string
  role: string
  user: { name: string; email: string }
}

type Invitation = {
  id: string
  email: string
  role: string | null
  status: string
}

type Org = {
  name: string
  members: Member[]
  invitations: Invitation[]
}

type Props = {
  initialSettings: OrgSettings | null
  org: Org
  currentUserId: string
  canManage: boolean
  organizationId: string
}

const navItems = [
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "members", label: "Members", icon: Users },
] as const

type Section = (typeof navItems)[number]["id"]

function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
  }
  return <Badge variant={variants[role] ?? "outline"}>{role}</Badge>
}

export function SettingsTabs({
  initialSettings,
  org,
  currentUserId,
  canManage,
  organizationId,
}: Props) {
  const [active, setActive] = useState<Section>("api-keys")

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Settings sidebar nav */}
      <aside className="w-52 shrink-0 border-r bg-background p-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition-colors",
                active === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {active === "api-keys" && (
          <SettingsForm initialSettings={initialSettings} />
        )}

        {active === "members" && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Members</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {org.name}
                </p>
              </div>
              {canManage && (
                <InviteMemberDialog organizationId={organizationId} />
              )}
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
                          {member.userId !== currentUserId &&
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

            {org.invitations.filter((i) => i.status === "pending").length >
              0 && (
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
        )}
      </div>
    </div>
  )
}
