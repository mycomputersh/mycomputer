"use client"

import { useState } from "react"
import {
  Bot,
  Brain,
  Code,
  FolderOpen,
  Globe,
  ListChecks,
  Plug,
  Plus,
  Search,
  Server,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { MarketplaceItem } from "@/lib/marketplace"

// ─── Types ────────────────────────────────────────────────────────────────────

export type McpServerRow = {
  id: string
  name: string
  url: string
  installedAt: Date | string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  Globe,
  Code,
  Brain,
  FolderOpen,
  ListChecks,
  Bot,
}

const CATEGORY_CONFIG: Record<
  string,
  { badge: string; iconBg: string; dot: string }
> = {
  Research: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  Development: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  Memory: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  Files: {
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  Productivity: {
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    iconBg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  AI: {
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
  },
}

const FALLBACK_CONFIG = {
  badge: "bg-muted text-muted-foreground",
  iconBg: "bg-muted text-muted-foreground",
  dot: "bg-muted-foreground",
}

// ─── Built-in Tool Row ────────────────────────────────────────────────────────

function ToolCard({
  item,
  installed,
}: {
  item: MarketplaceItem
  installed: boolean
}) {
  const [isInstalled, setIsInstalled] = useState(installed)
  const [loading, setLoading] = useState(false)
  const Icon = ICONS[item.icon] ?? Globe
  const cfg = CATEGORY_CONFIG[item.category] ?? FALLBACK_CONFIG

  const toggle = async () => {
    setLoading(true)
    try {
      const method = isInstalled ? "DELETE" : "POST"
      const res = await fetch(`/api/marketplace/${item.id}`, { method })
      if (res.ok) setIsInstalled((v) => !v)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/40",
        isInstalled && "bg-primary/[0.02]",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          cfg.iconBg,
        )}
      >
        <Icon className="size-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{item.title}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0",
              cfg.badge,
            )}
          >
            {item.category}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
      </div>

      <Button
        size="sm"
        variant={isInstalled ? "outline" : "default"}
        onClick={toggle}
        disabled={loading}
        className={cn(
          "h-6 px-2 text-xs shrink-0",
          isInstalled && "text-destructive border-destructive/40 hover:bg-destructive/10",
        )}
      >
        {loading ? "…" : isInstalled ? "Uninstall" : "Install"}
      </Button>
    </div>
  )
}

// ─── MCP Server Card ──────────────────────────────────────────────────────────

function McpServerCard({
  server,
  onRemove,
}: {
  server: McpServerRow
  onRemove: (id: string) => void
}) {
  const [removing, setRemoving] = useState(false)

  const remove = async () => {
    setRemoving(true)
    try {
      const res = await fetch(`/api/marketplace/mcp/${server.id}`, { method: "DELETE" })
      if (res.ok) onRemove(server.id)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-primary/[0.02] hover:bg-accent/40 transition-colors">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <Server className="size-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{server.name}</span>
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shrink-0">
            MCP
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{server.url}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={remove}
        disabled={removing}
        className="h-6 px-2 text-xs shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10"
      >
        <Trash2 className="size-3 mr-1" />
        {removing ? "…" : "Remove"}
      </Button>
    </div>
  )
}

// ─── Add MCP Server Dialog ────────────────────────────────────────────────────

function AddMcpDialog({ onAdd }: { onAdd: (server: McpServerRow) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!name.trim() || !url.trim()) {
      setError("Name and URL are required.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/marketplace/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: url.trim() }),
      })
      if (res.ok) {
        const server = await res.json()
        onAdd(server)
        setOpen(false)
        setName("")
        setUrl("")
      } else {
        setError("Failed to add MCP server.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5">
          <Plus className="size-3.5" />
          Add Server
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Connect an MCP-compatible server to extend your agent with custom tools.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mcp-name">Name</Label>
            <Input
              id="mcp-name"
              placeholder="My Computer MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mcp-url">SSE URL</Label>
            <Input
              id="mcp-url"
              placeholder="http://localhost:3001/sse"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The SSE endpoint of your MCP server (e.g.{" "}
              <code className="rounded bg-muted px-1 py-0.5">http://localhost:3001/sse</code>)
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Adding…" : "Add Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "tools" | "mcp"

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
      {(
        [
          { id: "tools", label: "Built-in Tools", icon: Plug },
          { id: "mcp", label: "MCP Servers", icon: Server },
        ] as { id: Tab; label: string; icon: LucideIcon }[]
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            active === id
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Main Grid ────────────────────────────────────────────────────────────────

export function MarketplaceGrid({
  items,
  initialMcpServers,
}: {
  items: (MarketplaceItem & { installed: boolean })[]
  initialMcpServers: McpServerRow[]
}) {
  const [tab, setTab] = useState<Tab>("tools")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [mcpList, setMcpList] = useState<McpServerRow[]>(initialMcpServers)

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))]

  const visibleItems = items.filter((i) => {
    const matchesCategory = categoryFilter === "All" || i.category === categoryFilter
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabBar active={tab} onChange={setTab} />

        {tab === "tools" && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs w-48"
            />
          </div>
        )}

        {tab === "mcp" && (
          <AddMcpDialog onAdd={(s) => setMcpList((prev) => [s, ...prev])} />
        )}
      </div>

      {/* Tools tab */}
      {tab === "tools" && (
        <div className="space-y-4">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-accent",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <Search className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No tools found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search or category</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {visibleItems.map((item) => (
                <ToolCard key={item.id} item={item} installed={item.installed} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MCP tab */}
      {tab === "mcp" && (
        <div className="space-y-4">
          {/* Getting started hint */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Getting started</p>
            Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              cd mcp-server && npm install && npm run dev
            </code>{" "}
            to start the example MCP server on{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              http://localhost:3001
            </code>
            , then click <strong>Add Server</strong> to connect it.
          </div>

          {mcpList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <Server className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No MCP servers connected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add an MCP server to extend your agent with custom tools
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {mcpList.map((server) => (
                <McpServerCard
                  key={server.id}
                  server={server}
                  onRemove={(id) => setMcpList((prev) => prev.filter((s) => s.id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
