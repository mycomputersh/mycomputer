"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Clock01Icon,
  FlashIcon,
  AlertCircleIcon,
  CommandLineIcon,
  Cancel01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  CpuIcon,
} from "@hugeicons/core-free-icons"
import type { LlmTrace } from "@/db/telemetry-schema"

interface TelemetryPanelProps {
  chatId: string
  onClose: () => void
  /** Changing this value triggers a re-fetch (pass `status` from useChat) */
  refreshTrigger?: unknown
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatTokens(n: number | null | undefined): string {
  if (n == null) return "—"
  return n.toLocaleString()
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "success" | "error" | "warning"
}) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-500/10 text-green-700 dark:text-green-400",
    error: "bg-destructive/10 text-destructive",
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[variant]}`}>
      {children}
    </span>
  )
}

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1)

  if (data === null || data === undefined)
    return <span className="text-muted-foreground">null</span>
  if (typeof data === "string")
    return <span className="text-green-600 dark:text-green-400 break-all">&quot;{data}&quot;</span>
  if (typeof data === "number" || typeof data === "boolean")
    return <span className="text-blue-600 dark:text-blue-400">{String(data)}</span>

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground">[]</span>
    return (
      <span>
        <button onClick={() => setCollapsed((c) => !c)} className="text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowDown01Icon} className="inline size-3" />
          <span className="ml-0.5 text-muted-foreground">Array({data.length})</span>
        </button>
        {!collapsed && (
          <div className="ml-3 border-l border-border pl-2 mt-0.5 space-y-0.5">
            {data.map((item, i) => (
              <div key={i} className="flex gap-1">
                <span className="text-muted-foreground shrink-0">{i}:</span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    )
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-muted-foreground">{"{}"}</span>
    return (
      <span>
        <button onClick={() => setCollapsed((c) => !c)} className="text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowDown01Icon} className="inline size-3" />
          <span className="ml-0.5 text-muted-foreground">{`{${entries.length} keys}`}</span>
        </button>
        {!collapsed && (
          <div className="ml-3 border-l border-border pl-2 mt-0.5 space-y-0.5">
            {entries.map(([key, val]) => (
              <div key={key} className="flex gap-1 flex-wrap">
                <span className="text-orange-600 dark:text-orange-400 shrink-0 font-medium">{key}:</span>
                <JsonTree data={val} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    )
  }

  return <span>{String(data)}</span>
}

function PromptMessages({ messages }: { messages: unknown }) {
  if (!Array.isArray(messages) || messages.length === 0)
    return <p className="text-muted-foreground text-xs">No prompt data</p>

  return (
    <div className="space-y-2">
      {(messages as Array<{ role?: string; content?: unknown }>).map((msg, i) => (
        <div key={i} className="rounded border border-border text-xs overflow-hidden">
          <div
            className={`px-2 py-1 font-medium text-[10px] uppercase tracking-wide ${
              msg.role === "user"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : msg.role === "assistant"
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {msg.role ?? "unknown"}
          </div>
          <div className="p-2 font-mono text-[11px] leading-relaxed break-all">
            <JsonTree data={msg.content} depth={0} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TraceDetail({ trace }: { trace: LlmTrace }) {
  const totalIn = trace.inputTokensTotal
  const totalOut = trace.outputTokensTotal
  const totalTokens = (totalIn ?? 0) + (totalOut ?? 0)

  // Pre-cast jsonb unknowns to typed arrays
  const toolCalls = Array.isArray(trace.toolCalls)
    ? (trace.toolCalls as Array<{ name?: string; input?: unknown }>)
    : null
  const toolsAvailable = Array.isArray(trace.toolsAvailable)
    ? (trace.toolsAvailable as string[])
    : null
  const warnings = Array.isArray(trace.warnings)
    ? (trace.warnings as unknown[])
    : null

  return (
    <div className="space-y-4 text-xs">
      <section>
        <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Tokens</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Input total</span>
            <span className="font-mono">{formatTokens(trace.inputTokensTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Output total</span>
            <span className="font-mono">{formatTokens(trace.outputTokensTotal)}</span>
          </div>
          {trace.inputTokensCacheRead != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache read</span>
              <span className="font-mono text-green-600 dark:text-green-400">
                {formatTokens(trace.inputTokensCacheRead)}
              </span>
            </div>
          )}
          {trace.inputTokensCacheWrite != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache write</span>
              <span className="font-mono">{formatTokens(trace.inputTokensCacheWrite)}</span>
            </div>
          )}
          {trace.inputTokensNoCache != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input (no cache)</span>
              <span className="font-mono">{formatTokens(trace.inputTokensNoCache)}</span>
            </div>
          )}
          {trace.outputTokensReasoning != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reasoning</span>
              <span className="font-mono">{formatTokens(trace.outputTokensReasoning)}</span>
            </div>
          )}
          {totalTokens > 0 && (
            <div className="flex justify-between col-span-2 border-t border-border pt-1 mt-0.5">
              <span className="font-medium">Total</span>
              <span className="font-mono font-medium">{formatTokens(totalTokens)}</span>
            </div>
          )}
        </div>
      </section>
      <section>
        <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Timing</h4>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono">{formatMs(trace.durationMs)}</span>
          </div>
          {trace.firstTokenMs != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time to first token</span>
              <span className="font-mono">{formatMs(trace.firstTokenMs)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Started at</span>
            <span className="font-mono">{new Date(trace.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </section>
      {toolCalls && toolCalls.length > 0 ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Tool Calls
          </h4>
          <div className="space-y-1.5">
            {toolCalls.map((tc, i) => (
              <div key={i} className="rounded border border-border overflow-hidden">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50">
                  <HugeiconsIcon icon={CommandLineIcon} className="size-3 text-muted-foreground" />
                  <span className="font-mono font-medium text-[11px]">{tc.name}</span>
                </div>
                {tc.input != null ? (
                  <div className="p-2 font-mono text-[11px] leading-relaxed">
                    <JsonTree data={tc.input} depth={0} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {trace.textContent ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Response Text
          </h4>
          <pre className="bg-muted/50 rounded p-2 whitespace-pre-wrap break-all text-[11px] leading-relaxed max-h-40 overflow-y-auto">
            {trace.textContent}
          </pre>
        </section>
      ) : null}
      {trace.responseMetadata ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Response Metadata
          </h4>
          <div className="font-mono text-[11px]">
            <JsonTree data={trace.responseMetadata} depth={0} />
          </div>
        </section>
      ) : null}
      {warnings && warnings.length > 0 ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Warnings</h4>
          <div className="font-mono text-[11px]">
            <JsonTree data={warnings} depth={0} />
          </div>
        </section>
      ) : null}
      {trace.error ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-destructive">Error</h4>
          <pre className="bg-destructive/10 text-destructive rounded p-2 whitespace-pre-wrap break-all text-[11px]">
            {trace.error}
          </pre>
        </section>
      ) : null}
      <section>
        <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Prompt</h4>
        <PromptMessages messages={trace.promptMessages} />
      </section>
      {toolsAvailable && toolsAvailable.length > 0 ? (
        <section>
          <h4 className="font-semibold mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Tools Available
          </h4>
          <div className="flex flex-wrap gap-1">
            {toolsAvailable.map((name) => (
              <span key={name} className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                {name}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function TraceRow({ trace, index }: { trace: LlmTrace; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const totalTokens = (trace.inputTokensTotal ?? 0) + (trace.outputTokensTotal ?? 0)
  const hasError = !!trace.error
  const finishVariant = hasError ? "error" : trace.finishReason === "stop" ? "success" : "default"

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${hasError ? "border-destructive/30" : ""}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
      >
        <HugeiconsIcon
          icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
          className="size-3.5 text-muted-foreground shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
            <span className="text-xs font-medium truncate">{trace.model}</span>
            <Badge variant={finishVariant}>{hasError ? "error" : (trace.finishReason ?? "unknown")}</Badge>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} className="size-3" />
              {formatMs(trace.durationMs)}
            </span>
            {totalTokens > 0 && (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={CpuIcon} className="size-3" />
                {formatTokens(totalTokens)} tok
              </span>
            )}
            {trace.firstTokenMs != null && (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={FlashIcon} className="size-3" />
                TTFT {formatMs(trace.firstTokenMs)}
              </span>
            )}
            {hasError && <HugeiconsIcon icon={AlertCircleIcon} className="size-3 text-destructive" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20">
          <TraceDetail trace={trace} />
        </div>
      )}
    </div>
  )
}

export function TelemetryPanel({ chatId, onClose, refreshTrigger }: TelemetryPanelProps) {
  const [traces, setTraces] = useState<LlmTrace[]>([])
  const [loading, setLoading] = useState(true)
  const prevTrigger = useRef(refreshTrigger)

  const fetchTraces = async () => {
    try {
      const res = await fetch(`/api/traces/${chatId}`)
      if (res.ok) setTraces(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTraces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => {
    if (prevTrigger.current !== refreshTrigger) {
      prevTrigger.current = refreshTrigger
      if (refreshTrigger !== "streaming") fetchTraces()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const totalTokensIn = traces.reduce((s, t) => s + (t.inputTokensTotal ?? 0), 0)
  const totalTokensOut = traces.reduce((s, t) => s + (t.outputTokensTotal ?? 0), 0)
  const totalDuration = traces.reduce((s, t) => s + (t.durationMs ?? 0), 0)
  const cacheRead = traces.reduce((s, t) => s + (t.inputTokensCacheRead ?? 0), 0)

  return (
    <div className="w-[400px] shrink-0 border-l border-border flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Analytics01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Traces</span>
          {traces.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {traces.length} step{traces.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>

      {/* Summary stats */}
      {traces.length > 0 && (
        <div className="grid grid-cols-4 gap-px bg-border border-b border-border shrink-0">
          {[
            { label: "Steps", value: String(traces.length) },
            { label: "In", value: formatTokens(totalTokensIn) },
            { label: "Out", value: formatTokens(totalTokensOut) },
            { label: "Time", value: formatMs(totalDuration) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold font-mono">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cache hit banner */}
      {cacheRead > 0 && (
        <div className="px-4 py-1.5 bg-green-500/10 border-b border-green-500/20 text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5 shrink-0">
          <HugeiconsIcon icon={FlashIcon} className="size-3" />
          {formatTokens(cacheRead)} tokens from cache
        </div>
      )}

      {/* Trace list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">Loading…</div>
        ) : traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <HugeiconsIcon icon={Analytics01Icon} className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No traces yet.</p>
            <p className="text-xs text-muted-foreground/70">Traces appear after the first LLM call.</p>
          </div>
        ) : (
          traces.map((trace, i) => <TraceRow key={trace.id} trace={trace} index={i} />)
        )}
      </div>
    </div>
  )
}
