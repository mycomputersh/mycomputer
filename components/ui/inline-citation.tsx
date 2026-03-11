"use client"

import { HoverCard } from "radix-ui"
import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CitationSource } from "@/lib/tools/sources"

// ─── Single source card ───────────────────────────────────────────────────────

function SourceCard({ source }: { source: CitationSource }) {
  return (
    <div className="space-y-1">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-1.5 font-medium text-sm leading-snug hover:underline"
      >
        <span className="flex-1 line-clamp-2">{source.title}</span>
        <ExternalLinkIcon className="size-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      </a>
      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
      {source.description && (
        <p className="text-xs text-muted-foreground line-clamp-3 pt-0.5 border-t">
          {source.description}
        </p>
      )}
    </div>
  )
}

// ─── Inline citation badge + popover ─────────────────────────────────────────

interface InlineCitationProps {
  sources: CitationSource[]
}

export function InlineCitation({ sources }: InlineCitationProps) {
  const [index, setIndex] = useState(0)
  const source = sources[index]
  const total = sources.length

  return (
    <HoverCard.Root openDelay={150} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center",
            "size-[1.1em] rounded-full align-middle",
            "bg-primary/10 text-primary text-[0.65em] font-semibold",
            "hover:bg-primary/20 transition-colors cursor-pointer",
            "mx-[0.15em] leading-none",
          )}
        >
          {source.number}
        </button>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={6}
          className={cn(
            "z-50 w-72 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <SourceCard source={source} />

          {total > 1 && (
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="rounded p-0.5 hover:bg-accent transition-colors"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <span className="text-xs text-muted-foreground">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="rounded p-0.5 hover:bg-accent transition-colors"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          )}

          <HoverCard.Arrow className="fill-border" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
