"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { OrgSettings } from "@/db/settings-schema"

const AI_PROVIDERS = [
  { value: "google", label: "Google Gemini" },
  { value: "openai", label: "OpenAI (or compatible)" },
] as const

const EMBEDDING_PROVIDERS = [
  { value: "google", label: "Google (gemini-embedding-001)" },
  { value: "openai", label: "OpenAI (text-embedding-3-small)" },
] as const

const DEFAULT_MODELS: Record<string, string> = {
  google: "gemini-2.5-flash",
  openai: "gpt-4o",
}

const DEFAULT_EMBEDDING_MODELS: Record<string, string> = {
  google: "gemini-embedding-001",
  openai: "text-embedding-3-small",
}

type FormState = {
  aiProvider: string
  aiApiKey: string
  aiBaseUrl: string
  aiModel: string
  embeddingProvider: string
  embeddingModel: string
  embeddingApiKey: string
  embeddingBaseUrl: string
}

function toFormState(settings: OrgSettings | null): FormState {
  return {
    aiProvider: settings?.aiProvider ?? "google",
    aiApiKey: settings?.aiApiKey ?? "",
    aiBaseUrl: settings?.aiBaseUrl ?? "",
    aiModel: settings?.aiModel ?? "",
    embeddingProvider: settings?.embeddingProvider ?? "google",
    embeddingModel: settings?.embeddingModel ?? "",
    embeddingApiKey: settings?.embeddingApiKey ?? "",
    embeddingBaseUrl: settings?.embeddingBaseUrl ?? "",
  }
}

export function SettingsForm({ initialSettings }: { initialSettings: OrgSettings | null }) {
  const [form, setForm] = useState<FormState>(toFormState(initialSettings))
  const [saving, setSaving] = useState(false)

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const embeddingUseSameKey =
    form.embeddingProvider === form.aiProvider && !form.embeddingApiKey

  return (
    <div className="space-y-8">
      {/* ── AI Provider ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="font-medium">AI Provider</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            The language model used to power the agent.
          </p>
        </div>

        <div className="grid gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <div className="flex gap-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("aiProvider", p.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    form.aiProvider === p.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aiApiKey">API Key</Label>
            <Input
              id="aiApiKey"
              type="password"
              placeholder={`Your ${form.aiProvider === "google" ? "Google AI" : "OpenAI"} API key`}
              value={form.aiApiKey}
              onChange={(e) => set("aiApiKey", e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aiBaseUrl">
              Base URL{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="aiBaseUrl"
              type="url"
              placeholder={
                form.aiProvider === "openai"
                  ? "https://api.openai.com/v1"
                  : "Leave blank to use default"
              }
              value={form.aiBaseUrl}
              onChange={(e) => set("aiBaseUrl", e.target.value)}
            />
            {form.aiProvider === "openai" && (
              <p className="text-xs text-muted-foreground">
                Set a custom base URL to use OpenAI-compatible providers (Ollama,
                Together AI, Groq, etc.)
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aiModel">
              Model{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="aiModel"
              placeholder={`Default: ${DEFAULT_MODELS[form.aiProvider] ?? "gpt-4o"}`}
              value={form.aiModel}
              onChange={(e) => set("aiModel", e.target.value)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Embedding Provider ──────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="font-medium">Embedding Provider</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Used for semantic memory storage and recall.
          </p>
        </div>

        <div className="grid gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <div className="flex gap-2">
              {EMBEDDING_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("embeddingProvider", p.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    form.embeddingProvider === p.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="embeddingModel">
              Model{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="embeddingModel"
              placeholder={`Default: ${DEFAULT_EMBEDDING_MODELS[form.embeddingProvider] ?? "text-embedding-3-small"}`}
              value={form.embeddingModel}
              onChange={(e) => set("embeddingModel", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="embeddingApiKey">
              API Key{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="embeddingApiKey"
              type="password"
              placeholder={
                embeddingUseSameKey
                  ? "Using same key as AI provider"
                  : "Override with a different key"
              }
              value={form.embeddingApiKey}
              onChange={(e) => set("embeddingApiKey", e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="embeddingBaseUrl">
              Base URL{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="embeddingBaseUrl"
              type="url"
              placeholder="Leave blank to use provider default"
              value={form.embeddingBaseUrl}
              onChange={(e) => set("embeddingBaseUrl", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
