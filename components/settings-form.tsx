"use client"

import { useForm } from "@tanstack/react-form"
import { CheckCircle2, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModelMultiSelect, type ModelOption } from "@/components/model-multi-select"
import type { ProviderConfig, ProviderConfigs } from "@/db/settings-schema"
import { cn } from "@/lib/utils"

// ── Provider registry ─────────────────────────────────────────────────────────

type ProviderDef = {
  id: string
  name: string
  description: string
  iconBg: string
  iconLabel: string
  knownModels: ModelOption[]
  baseUrlPlaceholder?: string
  baseUrlHint?: string
  instructions: {
    steps: string[]
    apiKeyUrl: string
    apiKeyUrlLabel: string
  }
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini 2.5 Flash, Pro, and more",
    iconBg: "bg-blue-500",
    iconLabel: "G",
    knownModels: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
    instructions: {
      steps: [
        "Go to Google AI Studio and sign in with your Google account.",
        'Click "Get API key" in the left sidebar, then "Create API key".',
        "Copy the generated key and paste it above.",
      ],
      apiKeyUrl: "https://aistudio.google.com/apikey",
      apiKeyUrlLabel: "Google AI Studio → API Keys",
    },
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, o1, o3, and more",
    iconBg: "bg-zinc-800",
    iconLabel: "O",
    knownModels: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o1", name: "o1" },
      { id: "o1-mini", name: "o1 Mini" },
      { id: "o3", name: "o3" },
      { id: "o3-mini", name: "o3 Mini" },
      { id: "o4-mini", name: "o4 Mini" },
    ],
    baseUrlPlaceholder: "https://api.openai.com/v1",
    baseUrlHint:
      "Override to use any OpenAI-compatible provider (Ollama, Groq, Together AI, etc.)",
    instructions: {
      steps: [
        "Log in to the OpenAI platform and navigate to API keys.",
        'Click "Create new secret key", give it a name, and confirm.',
        "Copy the key immediately — it won't be shown again.",
      ],
      apiKeyUrl: "https://platform.openai.com/api-keys",
      apiKeyUrlLabel: "OpenAI Platform → API Keys",
    },
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 4, Claude 3.7, and more",
    iconBg: "bg-orange-500",
    iconLabel: "A",
    knownModels: [
      { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    ],
    instructions: {
      steps: [
        "Sign in to the Anthropic Console.",
        'Open "API Keys" from the left menu and click "Create Key".',
        "Copy the key and paste it above.",
      ],
      apiKeyUrl: "https://console.anthropic.com/settings/keys",
      apiKeyUrlLabel: "Anthropic Console → API Keys",
    },
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3, Mixtral — ultra-fast inference",
    iconBg: "bg-yellow-500",
    iconLabel: "Gr",
    knownModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B" },
    ],
    baseUrlPlaceholder: "https://api.groq.com/openai/v1",
    instructions: {
      steps: [
        "Log in to GroqCloud and go to the API Keys section.",
        'Click "Create API Key", add a name, and generate.',
        "Copy the key and paste it above.",
      ],
      apiKeyUrl: "https://console.groq.com/keys",
      apiKeyUrlLabel: "GroqCloud Console → API Keys",
    },
  },
  {
    id: "mistral",
    name: "Mistral",
    description: "Mistral Large, Codestral, and more",
    iconBg: "bg-indigo-500",
    iconLabel: "Mi",
    knownModels: [
      { id: "mistral-large-latest", name: "Mistral Large" },
      { id: "mistral-medium-latest", name: "Mistral Medium" },
      { id: "mistral-small-latest", name: "Mistral Small" },
      { id: "codestral-latest", name: "Codestral" },
      { id: "open-mistral-7b", name: "Mistral 7B" },
    ],
    instructions: {
      steps: [
        "Sign in to La Plateforme by Mistral AI.",
        'Navigate to "API Keys" and click "Create new key".',
        "Copy the key and paste it above.",
      ],
      apiKeyUrl: "https://console.mistral.ai/api-keys",
      apiKeyUrlLabel: "Mistral Console → API Keys",
    },
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Run models locally on your machine",
    iconBg: "bg-emerald-600",
    iconLabel: "Ol",
    knownModels: [
      { id: "llama3.2", name: "Llama 3.2" },
      { id: "llama3.1", name: "Llama 3.1" },
      { id: "mistral", name: "Mistral" },
      { id: "codellama", name: "Code Llama" },
      { id: "phi4", name: "Phi 4" },
      { id: "qwen2.5", name: "Qwen 2.5" },
      { id: "deepseek-r1", name: "DeepSeek R1" },
    ],
    baseUrlPlaceholder: "http://localhost:11434",
    baseUrlHint:
      "Point to your local Ollama server (default: http://localhost:11434).",
    instructions: {
      steps: [
        "Download and install Ollama from the official website.",
        "Run `ollama serve` to start the local server.",
        "Pull a model with `ollama pull llama3.2`, then set the Base URL above.",
      ],
      apiKeyUrl: "https://ollama.com/download",
      apiKeyUrlLabel: "Download Ollama",
    },
  },
]

// ── Provider config form ──────────────────────────────────────────────────────

function ProviderConfigForm({
  provider,
  initialConfig,
  onSave,
}: {
  provider: ProviderDef
  initialConfig: ProviderConfig
  onSave: (providerId: string, config: ProviderConfig) => Promise<void>
}) {
  const [models, setModels] = useState<string[]>(initialConfig.models ?? [])

  const form = useForm({
    defaultValues: {
      apiKey: initialConfig.apiKey ?? "",
      baseUrl: initialConfig.baseUrl ?? "",
    },
    onSubmit: async ({ value }) => {
      await onSave(provider.id, {
        apiKey: value.apiKey || undefined,
        baseUrl: value.baseUrl || undefined,
        models: models.length > 0 ? models : undefined,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex gap-8"
    >
      {/* Left: fields */}
      <div className="flex-1 shrink-0 space-y-5">
        <div>
          <h2 className="text-sm font-medium">{provider.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {provider.description}
          </p>
        </div>

        <div className="space-y-4">
          <form.Field name="apiKey">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={`${provider.id}-apiKey`} className="text-xs">
                  API Key
                </Label>
                <Input
                  id={`${provider.id}-apiKey`}
                  type="password"
                  placeholder="sk-••••••••••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="off"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </form.Field>

          <div className="space-y-1.5">
            <Label className="text-xs">Models</Label>
            <ModelMultiSelect
              providerId={provider.id}
              knownModels={provider.knownModels}
              value={models}
              onChange={setModels}
            />
          </div>

          {provider.baseUrlPlaceholder !== undefined && (
            <form.Field name="baseUrl">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={`${provider.id}-baseUrl`} className="text-xs">
                    Base URL{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id={`${provider.id}-baseUrl`}
                    type="url"
                    placeholder={provider.baseUrlPlaceholder}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="h-8 text-xs"
                  />
                  {provider.baseUrlHint && (
                    <p className="text-xs text-muted-foreground">
                      {provider.baseUrlHint}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )}
        </div>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          )}
        </form.Subscribe>
      </div>

      {/* Right: instructions */}
      <div className="w-72 rounded-lg border bg-muted/40 p-4 space-y-3">
        <h3 className="text-xs font-medium">How to get your API key</h3>
        <ol className="space-y-2">
          {provider.instructions.steps.map((step, i) => (
            <li
              key={i.toString()}
              className="flex gap-2.5 text-xs text-muted-foreground"
            >
              <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-medium text-foreground border">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <a
          href={provider.instructions.apiKeyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          {provider.instructions.apiKeyUrlLabel}
        </a>
      </div>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsForm({
  initialProviderConfigs,
}: {
  initialProviderConfigs: ProviderConfigs
}) {
  const [selectedId, setSelectedId] = useState(PROVIDERS[0].id)
  const [configs, setConfigs] = useState<ProviderConfigs>(
    initialProviderConfigs,
  )

  const selectedProvider = PROVIDERS.find((p) => p.id === selectedId)!

  async function handleSave(providerId: string, config: ProviderConfig) {
    const next = { ...configs, [providerId]: config }
    setConfigs(next)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerConfigs: next }),
      })
      if (!res.ok) throw new Error()
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  return (
    <div className="flex h-full">
      {/* Provider list sidebar */}
      <aside className="w-44 shrink-0 border-r p-3">
        <nav className="flex flex-col gap-0.5">
          {PROVIDERS.map((provider) => {
            const isSelected = selectedId === provider.id
            const isConfigured = !!configs[provider.id]?.apiKey

            return (
              <button
                key={provider.id}
                onClick={() => setSelectedId(provider.id)}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition-colors outline-none",
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {/* Colored icon */}
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
                    provider.iconBg,
                  )}
                >
                  {provider.iconLabel}
                </span>

                <span className="flex-1 truncate">{provider.name}</span>

                {isConfigured && (
                  <CheckCircle2
                    className={cn(
                      "size-3 shrink-0",
                      isSelected ? "text-primary" : "text-emerald-500",
                    )}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Config panel */}
      <div className="flex-1 overflow-y-auto p-4">
        <ProviderConfigForm
          key={selectedId}
          provider={selectedProvider}
          initialConfig={configs[selectedId] ?? {}}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
