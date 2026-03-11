import type { ProviderConfigs } from "@/db/settings-schema"
import type { AvailableModel } from "@/components/model-selector"

const PROVIDER_META: Record<string, { label: string; iconBg: string }> = {
  google:    { label: "Gemini",   iconBg: "bg-blue-500"    },
  openai:    { label: "OpenAI",   iconBg: "bg-zinc-800"    },
  anthropic: { label: "Anthropic",iconBg: "bg-orange-500"  },
  groq:      { label: "Groq",     iconBg: "bg-yellow-500"  },
  mistral:   { label: "Mistral",  iconBg: "bg-indigo-500"  },
  ollama:    { label: "Ollama",   iconBg: "bg-emerald-600" },
}

export function buildAvailableModels(providerConfigs: ProviderConfigs): AvailableModel[] {
  const models: AvailableModel[] = []

  for (const [providerId, config] of Object.entries(providerConfigs)) {
    if (!config?.models?.length) continue
    const meta = PROVIDER_META[providerId] ?? { label: providerId, iconBg: "bg-muted" }
    for (const modelId of config.models) {
      models.push({
        id: `${providerId}:${modelId}`,
        label: modelId,
        provider: meta.label,
        iconBg: meta.iconBg,
      })
    }
  }

  return models
}
