"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

export type AvailableModel = {
  id: string   // "provider:modelId"
  label: string
  provider: string
  iconBg: string
}

type Props = {
  models: AvailableModel[]
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ models, value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const selected = models.find((m) => m.id === value)

  if (models.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {selected && (
            <span
              className={cn(
                "inline-flex size-3.5 shrink-0 items-center justify-center rounded text-[8px] font-bold text-white",
                selected.iconBg
              )}
            >
              {selected.provider[0].toUpperCase()}
            </span>
          )}
          <span className="max-w-32 truncate">
            {selected?.label ?? "Select model"}
          </span>
          <ChevronsUpDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" side="top">
        <Command>
          <CommandInput placeholder="Search models…" className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onChange(model.id)
                    setOpen(false)
                  }}
                  className="text-xs"
                >
                  <span
                    className={cn(
                      "mr-2 inline-flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
                      model.iconBg
                    )}
                  >
                    {model.provider[0].toUpperCase()}
                  </span>
                  <span className="flex-1">{model.label}</span>
                  <Check
                    className={cn(
                      "ml-2 size-3.5 shrink-0",
                      value === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
