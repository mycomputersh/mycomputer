"use client"

import { Fragment, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { CopyIcon, RefreshCcwIcon, AlertCircleIcon } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Analytics01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { TelemetryPanel } from "@/components/telemetry-panel"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  CitationMessageResponse,
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import type { CitationSource } from "@/lib/tools/sources"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import {
  CodeRunnerRenderer,
  CreatePlanRenderer,
  FetchPageRenderer,
  RegisterSourcesRenderer,
  ListFilesRenderer,
  MemoryForgetRenderer,
  MemoryRecallRenderer,
  MemoryStoreRenderer,
  ReadFileRenderer,
  SpawnSubagentRenderer,
  UpdateStepStatusRenderer,
  WebSearchRenderer,
  WriteFileRenderer,
} from "@/components/tool-renderers"
import type { AgentUIMessage } from "@/lib/agents/main-agent"
import { useChatSidebar } from "@/components/chat-sidebar-context"

interface ChatViewProps {
  chatId: string | null
  initialMessages?: UIMessage[]
  initialError?: string | null
}

const SUGGESTIONS = [
  "Search for the latest AI news",
  "Write and run a Fibonacci function",
  "Plan a 3-step research workflow",
  "Delegate a research task to a subagent",
  "Remember my name and recall it later",
]

export function ChatView({ chatId: initialChatId, initialMessages = [], initialError = null }: ChatViewProps) {
  const { addChat } = useChatSidebar()
  const [input, setInput] = useState("")
  const [telemetryOpen, setTelemetryOpen] = useState(false)
  // Persistent error: seeded from DB, updated on error/success
  const [persistedError, setPersistedError] = useState<string | null>(initialError)

  const chatIdRef = useRef<string | null>(initialChatId)
  const messagesRef = useRef<UIMessage[]>(initialMessages)

  const patchChat = (id: string, updates: Record<string, unknown>) => {
    fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
  }

  const saveError = (id: string, msg: string | null) => {
    patchChat(id, { lastError: msg })
  }

  const { messages, sendMessage, status, error, regenerate } = useChat<AgentUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, trigger, messageId }) => ({
        body: { messages, trigger, messageId, chatId: chatIdRef.current },
      }),
    }),
    messages: initialMessages as AgentUIMessage[],
    onFinish: () => {
      if (chatIdRef.current) {
        // Clear any stored error on success and save messages
        patchChat(chatIdRef.current, { messages: messagesRef.current, lastError: null })
        setPersistedError(null)
      }
    },
    onError: (err) => {
      const msg = err.message || "Something went wrong."
      const isRateLimit =
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("too many requests") ||
        msg.includes("429")
      const display = isRateLimit
        ? "Rate limit reached — please wait a moment and try again."
        : msg
      setPersistedError(display)
      if (chatIdRef.current) saveError(chatIdRef.current, display)
      toast.error(isRateLimit ? "Rate limit reached" : "Error", {
        description: isRateLimit
          ? "You've hit the API rate limit. Please wait a moment and try again."
          : msg,
        duration: 6000,
      })
    },
  })

  messagesRef.current = messages

  const handleRetry = () => {
    setPersistedError(null)
    if (chatIdRef.current) saveError(chatIdRef.current, null)
    regenerate()
  }

  const handleSubmit = async (msg: PromptInputMessage) => {
    if (!msg.text.trim()) return

    // Clear error when user sends a new message
    setPersistedError(null)

    if (!chatIdRef.current) {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: msg.text.slice(0, 60) }),
      })
      const { id } = await res.json()
      chatIdRef.current = id
      addChat({ id, title: msg.text.slice(0, 60), folderId: null, updatedAt: new Date() })
      window.history.replaceState(null, "", `/dashboard/chat/${id}`)
    } else {
      saveError(chatIdRef.current, null)
    }

    sendMessage({ text: msg.text })
    setInput("")
  }

  return (
    <div className="flex h-full min-w-0">
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="px-4 py-6 max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">AI Agent</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                I can search the web, run code, manage files, remember things, plan workflows, and delegate tasks to subagents.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, messageIndex) => {
            const isLast = messageIndex === messages.length - 1

            // Build a source map from all registerSources calls in this message
            const sourceMap = new Map<number, CitationSource>()
            for (const part of message.parts) {
              if (part.type === "tool-registerSources" && part.input?.sources) {
                for (const s of part.input.sources as CitationSource[]) {
                  sourceMap.set(s.number, s)
                }
              }
            }

            return (
              <Fragment key={message.id}>
                {message.parts.map((part, partIndex) => {
                  const key = `${message.id}-${partIndex}`

                  if (part.type === "text") {
                    return (
                      <Fragment key={key}>
                        <Message from={message.role}>
                          <MessageContent>
                            <CitationMessageResponse sourceMap={sourceMap}>
                              {part.text}
                            </CitationMessageResponse>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" && isLast && (
                          <MessageActions>
                            <MessageAction onClick={() => regenerate()} label="Retry">
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() => navigator.clipboard.writeText(part.text)}
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Fragment>
                    )
                  }

                  if (part.type === "tool-webSearch") return <WebSearchRenderer key={key} part={part} />
                  if (part.type === "tool-fetchPage") return <FetchPageRenderer key={key} part={part} />
                  if (part.type === "tool-registerSources") return <RegisterSourcesRenderer key={key} part={part} />
                  if (part.type === "tool-runCode") return <CodeRunnerRenderer key={key} part={part} />
                  if (part.type === "tool-memoryStore") return <MemoryStoreRenderer key={key} part={part} />
                  if (part.type === "tool-memoryRecall") return <MemoryRecallRenderer key={key} part={part} />
                  if (part.type === "tool-memoryForget") return <MemoryForgetRenderer key={key} part={part} />
                  if (part.type === "tool-createPlan") return <CreatePlanRenderer key={key} part={part} />
                  if (part.type === "tool-updateStepStatus") return <UpdateStepStatusRenderer key={key} part={part} />
                  if (part.type === "tool-spawnSubagent") return <SpawnSubagentRenderer key={key} part={part} />
                  if (part.type === "tool-writeFile") return <WriteFileRenderer key={key} part={part} />
                  if (part.type === "tool-readFile") return <ReadFileRenderer key={key} part={part} />
                  if (part.type === "tool-listFiles") return <ListFilesRenderer key={key} part={part} />

                  return null
                })}
              </Fragment>
            )
          })}
          {persistedError && (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {persistedError.toLowerCase().includes("rate limit")
                      ? "Rate limit reached"
                      : "Something went wrong"}
                  </p>
                  <p className="text-xs mt-0.5 text-destructive/80">{persistedError}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="shrink-0 text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="bg-background px-4 py-3">
        <PromptInput onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              placeholder="Ask the agent anything…"
              onChange={(e) => setInput(e.currentTarget.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-between">
            <button
              type="button"
              onClick={() => setTelemetryOpen((o) => !o)}
              disabled={!chatIdRef.current}
              title="View traces"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1 py-0.5 rounded"
            >
              <HugeiconsIcon icon={Analytics01Icon} className="size-3.5" />
              Traces
            </button>
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim() && status !== "streaming"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>

      {telemetryOpen && chatIdRef.current && (
        <TelemetryPanel
          chatId={chatIdRef.current}
          onClose={() => setTelemetryOpen(false)}
          refreshTrigger={status}
        />
      )}
    </div>
  )
}
