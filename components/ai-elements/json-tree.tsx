"use client"

import { useState } from "react"
import { ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

function JsonNode({
  value,
  depth = 0,
  label,
  isLast = true,
}: {
  value: JsonValue
  depth?: number
  label?: string | number
  isLast?: boolean
}) {
  const [open, setOpen] = useState(depth < 2)

  const prefix = label !== undefined ? (
    <span className="text-muted-foreground/70">{label}: </span>
  ) : null

  if (value === null) {
    return (
      <div className="flex items-center gap-0.5">
        {prefix}
        <span className="text-muted-foreground italic">null</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-0.5">
        {prefix}
        <span className="text-amber-600 dark:text-amber-400">{value ? "true" : "false"}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center gap-0.5">
        {prefix}
        <span className="text-blue-600 dark:text-blue-400">{value}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === "string") {
    const display = value.length > 120 ? value.slice(0, 120) + "…" : value
    return (
      <div className="flex items-start gap-0.5 min-w-0">
        {prefix}
        <span className="text-green-700 dark:text-green-400 break-all">"{display}"</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const entries = isArray
    ? (value as JsonValue[]).map((v, i) => [i, v] as [number, JsonValue])
    : Object.entries(value as Record<string, JsonValue>) as [string, JsonValue][]

  const open_bracket = isArray ? "[" : "{"
  const close_bracket = isArray ? "]" : "}"

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-0.5">
        {prefix}
        <span className="text-muted-foreground">{open_bracket}{close_bracket}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-0.5 cursor-pointer select-none hover:text-foreground group"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRightIcon
          className={cn(
            "size-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        {prefix}
        <span className="text-muted-foreground">{open_bracket}</span>
        {!open && (
          <span className="text-muted-foreground/60 text-[10px]">
            {entries.length} {isArray ? "items" : "keys"}
          </span>
        )}
        {!open && <span className="text-muted-foreground">{close_bracket}</span>}
        {!open && !isLast && <span className="text-muted-foreground">,</span>}
      </div>

      {open && (
        <div className="ml-3 border-l border-border/50 pl-2">
          {entries.map(([k, v], i) => (
            <JsonNode
              key={k}
              label={isArray ? undefined : k}
              value={v}
              depth={depth + 1}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="flex items-center gap-0.5">
          <span className="text-muted-foreground">{close_bracket}</span>
          {!isLast && <span className="text-muted-foreground">,</span>}
        </div>
      )}
    </div>
  )
}

export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="font-mono text-[11px] leading-5 p-2 overflow-auto max-h-64">
      <JsonNode value={data as JsonValue} />
    </div>
  )
}
