"use client"

import type {
  CodeRunnerInvocation,
  CreatePlanInvocation,
  FetchPageInvocation,
  ListFilesInvocation,
  MemoryForgetInvocation,
  MemoryRecallInvocation,
  MemoryStoreInvocation,
  ReadFileInvocation,
  RegisterSourcesInvocation,
  SpawnSubagentInvocation,
  UpdateStepStatusInvocation,
  WebSearchInvocation,
  WriteFileInvocation,
} from "@/lib/tools"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import { Badge } from "@/components/ui/badge"

// ─── Helpers ────────────────────────────────────────────────────────────────

function JsonOutput({ data }: { data: unknown }) {
  return (
    <MessageResponse>
      {"```json\n" + JSON.stringify(data, null, 2) + "\n```"}
    </MessageResponse>
  )
}

// ─── Web Search ─────────────────────────────────────────────────────────────

export function WebSearchRenderer({ part }: { part: WebSearchInvocation }) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader type="tool-webSearch" state={part.state} title="Web Search" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <div className="space-y-2 p-3">
                {part.output.results.map(
                  (
                    r: { title: string; url: string; snippet: string },
                    i: number,
                  ) => (
                    <div
                      key={i}
                      className="text-sm border-b last:border-0 pb-2"
                    >
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.url}</p>
                      <p className="text-xs mt-1">{r.snippet}</p>
                    </div>
                  ),
                )}
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Register Sources (invisible — citations rendered inline in text) ─────────

export function RegisterSourcesRenderer({
  part,
}: { part: RegisterSourcesInvocation }) {
  if (part.state !== "output-available" || !part.input?.sources?.length) {
    return null
  }
  return (
    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium">Sources:</span>
      {(part.input.sources as { number: number; title: string; url: string }[]).map((s) => (
        <a
          key={s.number}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-accent transition-colors"
        >
          <span className="text-[10px] font-semibold text-primary">[{s.number}]</span>
          <span className="truncate max-w-32">{s.title}</span>
        </a>
      ))}
    </div>
  )
}

// ─── Fetch Page ──────────────────────────────────────────────────────────────

export function FetchPageRenderer({ part }: { part: FetchPageInvocation }) {
  const output = part.state === "output-available" ? part.output : null
  return (
    <Tool defaultOpen={false}>
      <ToolHeader type="tool-fetchPage" state={part.state} title="Fetch Page" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            output ? (
              <div className="space-y-2 p-3 text-sm">
                <p className="font-medium truncate">{output.title}</p>
                <p className="text-xs text-muted-foreground truncate">{output.url}</p>
                <p className="text-xs text-muted-foreground">
                  {output.charCount.toLocaleString()} chars
                  {output.truncated && " (truncated)"}
                </p>
                <pre className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto rounded bg-muted/50 p-2">
                  {output.content.slice(0, 500)}
                  {output.content.length > 500 && "…"}
                </pre>
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Code Runner ─────────────────────────────────────────────────────────────

export function CodeRunnerRenderer({ part }: { part: CodeRunnerInvocation }) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader type="tool-runCode" state={part.state} title="Run Code" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <MessageResponse>
                {`**Exit code:** \`${part.output.exitCode}\` · **Duration:** ${part.output.durationMs}ms\n\n\`\`\`\n${part.output.stdout}\n\`\`\``}
              </MessageResponse>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Memory Store ─────────────────────────────────────────────────────────────

export function MemoryStoreRenderer({ part }: { part: MemoryStoreInvocation }) {
  return (
    <Tool defaultOpen={false}>
      <ToolHeader
        type="tool-memoryStore"
        state={part.state}
        title="Store Memory"
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <p className="text-xs text-muted-foreground p-3">
                Stored memory <code className="font-mono">{part.output.key}</code>
              </p>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Memory Recall ────────────────────────────────────────────────────────────

export function MemoryRecallRenderer({
  part,
}: {
  part: MemoryRecallInvocation
}) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader
        type="tool-memoryRecall"
        state={part.state}
        title="Recall Memory"
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <div className="p-3 space-y-2">
                {part.output.count === 0 ? (
                  <p className="text-xs text-muted-foreground">No memories found.</p>
                ) : (
                  part.output.results.map(
                    (r: { key: string; content: string; similarity: number }, i: number) => (
                      <div key={i} className="text-sm border-b last:border-0 pb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-muted-foreground">{r.key}</code>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round(r.similarity * 100)}% match
                          </span>
                        </div>
                        <p className="text-xs mt-0.5">{r.content}</p>
                      </div>
                    ),
                  )
                )}
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Memory Forget ────────────────────────────────────────────────────────────

export function MemoryForgetRenderer({
  part,
}: {
  part: MemoryForgetInvocation
}) {
  return (
    <Tool defaultOpen={false}>
      <ToolHeader
        type="tool-memoryForget"
        state={part.state}
        title="Forget Memory"
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <p className="text-xs text-muted-foreground p-3">
                Deleted memory <code className="font-mono">{part.output.key}</code>
              </p>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Create Plan ─────────────────────────────────────────────────────────────

export function CreatePlanRenderer({ part }: { part: CreatePlanInvocation }) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader
        type="tool-createPlan"
        state={part.state}
        title="Create Plan"
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium">{part.output.goal}</p>
                <ol className="space-y-1">
                  {part.output.steps.map(
                    (s: {
                      id: number
                      title: string
                      description: string
                      tool?: string
                    }) => (
                      <li key={s.id} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground w-4 shrink-0">
                          {s.id}.
                        </span>
                        <div>
                          <span className="font-medium">{s.title}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            — {s.description}
                          </span>
                          {s.tool && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {s.tool}
                            </Badge>
                          )}
                        </div>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Update Step Status ───────────────────────────────────────────────────────

export function UpdateStepStatusRenderer({
  part,
}: {
  part: UpdateStepStatusInvocation
}) {
  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    skipped: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-800",
  }
  return (
    <Tool defaultOpen={false}>
      <ToolHeader
        type="tool-updateStepStatus"
        state={part.state}
        title="Update Step"
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <p className="text-xs p-3">
                Step <strong>{part.output.stepId}</strong> →{" "}
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[part.output.status] ?? ""}`}
                >
                  {part.output.status}
                </span>
                {part.output.note && (
                  <span className="text-muted-foreground ml-2">
                    {part.output.note}
                  </span>
                )}
              </p>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Spawn Subagent ───────────────────────────────────────────────────────────

export function SpawnSubagentRenderer({
  part,
}: {
  part: SpawnSubagentInvocation
}) {
  // output is a UIMessage whose parts stream in progressively
  const subMessage = part.state === "output-available"
    ? (part.output as import("ai").UIMessage | undefined)
    : undefined

  // Collect the latest text while streaming (output is accumulated UIMessage during stream)
  const streamingOutput =
    part.state !== "output-available" && part.state !== "output-error"
      ? (part as { output?: { parts?: Array<{ type: string; text?: string }> } }).output
      : undefined
  const liveText = streamingOutput?.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("") ?? ""

  return (
    <Tool defaultOpen>
      <ToolHeader
        type="tool-spawnSubagent"
        state={part.state}
        title={`Subagent · ${part.input?.agentType ?? ""}`}
      />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            subMessage ? (
              // Render nested UIMessage parts from the completed subagent
              <div className="p-3 space-y-2">
                {subMessage.parts.map((p, i) => {
                  if (p.type === "text") {
                    return <MessageResponse key={i}>{p.text}</MessageResponse>
                  }
                  return null
                })}
              </div>
            ) : liveText ? (
              // Show live streamed text while still running
              <div className="p-3">
                <MessageResponse>{liveText}</MessageResponse>
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Write File ───────────────────────────────────────────────────────────────

export function WriteFileRenderer({ part }: { part: WriteFileInvocation }) {
  return (
    <Tool defaultOpen={false}>
      <ToolHeader type="tool-writeFile" state={part.state} title="Write File" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <p className="text-xs p-3 text-muted-foreground">
                Written <code className="font-mono">{part.output.path}</code> —{" "}
                {part.output.bytesWritten} bytes
              </p>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── Read File ────────────────────────────────────────────────────────────────

export function ReadFileRenderer({ part }: { part: ReadFileInvocation }) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader type="tool-readFile" state={part.state} title="Read File" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              part.output.found ? (
                <MessageResponse>
                  {`\`\`\`\n${part.output.content}\n\`\`\``}
                </MessageResponse>
              ) : (
                <p className="text-xs p-3 text-muted-foreground">
                  File not found: {part.input?.path}
                </p>
              )
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}

// ─── List Files ───────────────────────────────────────────────────────────────

export function ListFilesRenderer({ part }: { part: ListFilesInvocation }) {
  return (
    <Tool defaultOpen={part.state === "output-available"}>
      <ToolHeader type="tool-listFiles" state={part.state} title="List Files" />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={
            part.state === "output-available" && part.output ? (
              <div className="p-3">
                {part.output.count === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No files found.
                  </p>
                ) : (
                  <ul className="text-xs font-mono space-y-0.5">
                    {part.output.files.map((f: string) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null
          }
          errorText={part.state === "output-error" ? part.errorText : undefined}
        />
      </ToolContent>
    </Tool>
  )
}
