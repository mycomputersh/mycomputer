"use client"

import { Check, ChevronsUpDown, X } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ModelOption = { id: string; name: string }

type Props = {
  providerId: string
  knownModels: ModelOption[]
  value: string[]
  onChange: (models: string[]) => void
}

export function ModelMultiSelect({
  providerId,
  knownModels,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  function toggle(modelId: string) {
    onChange(
      value.includes(modelId)
        ? value.filter((m) => m !== modelId)
        : [...value, modelId],
    )
  }

  function remove(modelId: string) {
    onChange(value.filter((m) => m !== modelId))
  }

  // Allow adding a custom model ID not in the known list
  const trimmed = search.trim()
  const showAddCustom =
    trimmed.length > 0 &&
    !knownModels.some((m) => m.id === trimmed) &&
    !value.includes(trimmed)

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full justify-between px-2 text-xs font-normal"
          >
            <span className="text-muted-foreground">
              {value.length === 0
                ? "Select models…"
                : `${value.length} model${value.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or enter model ID…"
              value={search}
              onValueChange={setSearch}
              className="h-8 text-xs"
            />
            <CommandList>
              <CommandEmpty>
                {showAddCustom ? null : "No models found."}
              </CommandEmpty>
              {showAddCustom && (
                <CommandGroup heading="Custom">
                  <CommandItem
                    value={trimmed}
                    onSelect={() => {
                      toggle(trimmed)
                      setSearch("")
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-3.5",
                        value.includes(trimmed) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Add &ldquo;{trimmed}&rdquo;
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup heading="Known models">
                {knownModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => toggle(model.id)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-3.5 shrink-0",
                        value.includes(model.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {model.id}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((modelId) => (
            <Badge
              key={modelId}
              variant="secondary"
              className="h-5 gap-1 pl-2 pr-1 text-[10px] font-normal"
            >
              {modelId}
              <button
                type="button"
                onClick={() => remove(modelId)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
