"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}

type Props = {
  organizations: Organization[]
  activeOrg: Organization | null
}

function orgInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function OrgSwitcher({ organizations, activeOrg }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function switchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    router.refresh()
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const computedSlug = slug || toSlug(name)
    const { error } = await authClient.organization.create({
      name,
      slug: computedSlug,
    })
    if (error) {
      setError(error.message ?? "Failed to create organization")
      return
    }
    setOpen(false)
    setName("")
    setSlug("")
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto w-full justify-start gap-2 px-2 py-1.5"
          >
            {activeOrg ? (
              <>
                <Avatar size="sm" className="size-6 rounded-sm">
                  {activeOrg.logo && (
                    <AvatarImage src={activeOrg.logo} alt={activeOrg.name} />
                  )}
                  <AvatarFallback className="rounded-sm text-xs">
                    {orgInitials(activeOrg.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-left font-medium text-sm">
                  {activeOrg.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-left text-muted-foreground text-sm">
                Select organization
              </span>
            )}
            <svg
              className="ml-auto size-4 shrink-0 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l4-4 4 4M8 15l4 4 4-4"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => switchOrg(org.id)}
              className="gap-2"
            >
              <Avatar className="size-5 rounded-sm">
                {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
                <AvatarFallback className="rounded-sm text-xs">
                  {orgInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{org.name}</span>
              {activeOrg?.id === org.id && (
                <svg
                  className="ml-auto size-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
            <DialogDescription>
              Create a new workspace for your team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createOrg} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="new-org-name">Name</Label>
              <Input
                id="new-org-name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-org-slug">
                Slug{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="new-org-slug"
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
