"use client"

import { useState } from "react"
import {
  Bot,
  Brain,
  Code,
  FolderOpen,
  Globe,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MarketplaceItem } from "@/lib/marketplace"

const ICONS: Record<string, LucideIcon> = {
  Globe,
  Code,
  Brain,
  FolderOpen,
  ListChecks,
  Bot,
}

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Development: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Memory: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Files: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Productivity: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  AI: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
}

const ICON_BG: Record<string, string> = {
  Research: "bg-blue-500",
  Development: "bg-orange-500",
  Memory: "bg-purple-500",
  Files: "bg-green-500",
  Productivity: "bg-yellow-500",
  AI: "bg-pink-500",
}

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
        "group relative flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md",
        isInstalled && "border-primary/30 bg-primary/5",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-xl text-white",
          ICON_BG[item.category] ?? "bg-muted",
        )}
      >
        <Icon className="size-5" />
      </div>

      {/* Category */}
      <span
        className={cn(
          "mb-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
          CATEGORY_COLORS[item.category] ?? "bg-muted text-muted-foreground",
        )}
      >
        {item.category}
      </span>

      {/* Title + description */}
      <h3 className="font-semibold">{item.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">
        {item.description}
      </p>

      {/* Tools list */}
      <div className="mt-3 flex flex-wrap gap-1">
        {item.tools.map((t) => (
          <span
            key={t}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Action */}
      <div className="mt-4 flex items-center justify-between">
        {isInstalled && (
          <Badge variant="outline" className="text-xs text-primary border-primary/40">
            Installed
          </Badge>
        )}
        <Button
          size="sm"
          variant={isInstalled ? "outline" : "default"}
          onClick={toggle}
          disabled={loading}
          className={cn("ml-auto", isInstalled && "text-destructive border-destructive/40 hover:bg-destructive/10")}
        >
          {loading ? "…" : isInstalled ? "Uninstall" : "Install"}
        </Button>
      </div>
    </div>
  )
}

export function MarketplaceGrid({
  items,
}: {
  items: (MarketplaceItem & { installed: boolean })[]
}) {
  const [filter, setFilter] = useState("All")

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))]
  const visible = filter === "All" ? items : items.filter((i) => i.category === filter)

  return (
    <div>
      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <ToolCard key={item.id} item={item} installed={item.installed} />
        ))}
      </div>
    </div>
  )
}
