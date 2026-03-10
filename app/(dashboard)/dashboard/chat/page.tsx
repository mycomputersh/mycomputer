"use client"

import { Fragment, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
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
import { CopyIcon, RefreshCcwIcon } from "lucide-react"

export default function ChatPage() {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, regenerate } = useChat<AgentUIMessage>(
    {
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    },
  )

  function handleSubmit(msg: PromptInputMessage) {
    if (!msg.text.trim()) return
    sendMessage({ text: msg.text })
    setInput("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="px-4 py-6 max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="size-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">AI Agent</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                I can search the web, run code, manage files, remember things,
                plan workflows, and delegate tasks to subagents.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s)
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, messageIndex) => {
            const isLast = messageIndex === messages.length - 1
            return (
              <Fragment key={message.id}>
                {message.parts.map((part, partIndex) => {
                  const key = `${message.id}-${partIndex}`

                  // ── Text parts ──────────────────────────────────────────
                  if (part.type === "text") {
                    return (
                      <Fragment key={key}>
                        <Message from={message.role}>
                          <MessageContent>
                            <MessageResponse>{part.text}</MessageResponse>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" && isLast && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => regenerate()}
                              label="Retry"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() =>
                                navigator.clipboard.writeText(part.text)
                              }
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Fragment>
                    )
                  }

                  // ── Tool parts ──────────────────────────────────────────
                  if (part.type === "tool-webSearch")
                    return <WebSearchRenderer key={key} part={part} />
                  if (part.type === "tool-runCode")
                    return <CodeRunnerRenderer key={key} part={part} />
                  if (part.type === "tool-memoryStore")
                    return <MemoryStoreRenderer key={key} part={part} />
                  if (part.type === "tool-memoryRecall")
                    return <MemoryRecallRenderer key={key} part={part} />
                  if (part.type === "tool-memoryForget")
                    return <MemoryForgetRenderer key={key} part={part} />
                  if (part.type === "tool-createPlan")
                    return <CreatePlanRenderer key={key} part={part} />
                  if (part.type === "tool-updateStepStatus")
                    return <UpdateStepStatusRenderer key={key} part={part} />
                  if (part.type === "tool-spawnSubagent")
                    return <SpawnSubagentRenderer key={key} part={part} />
                  if (part.type === "tool-writeFile")
                    return <WriteFileRenderer key={key} part={part} />
                  if (part.type === "tool-readFile")
                    return <ReadFileRenderer key={key} part={part} />
                  if (part.type === "tool-listFiles")
                    return <ListFilesRenderer key={key} part={part} />

                  return null
                })}
              </Fragment>
            )
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background px-4 py-3">
        <PromptInput onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              placeholder="Ask the agent anything…"
              onChange={(e) => setInput(e.currentTarget.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim() && status !== "streaming"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  "Search for the latest AI news",
  "Write and run a Fibonacci function",
  "Plan a 3-step research workflow",
  "Delegate a research task to a subagent",
  "Remember my name and recall it later",
]
