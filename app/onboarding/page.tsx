"use client"

import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value }) => {
      setError(null)
      const slug = value.slug || toSlug(value.name)
      const { error } = await authClient.organization.create({
        name: value.name,
        slug,
      })
      if (error) {
        setError(error.message ?? "Failed to create organization")
        return
      }
      router.push("/dashboard")
    },
  })

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your organization</CardTitle>
          <CardDescription>
            Create your workspace to start collaborating with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    placeholder="Acme Corp"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                    }}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="slug">
              {(field) => (
                <div className="space-y-1">
                  <Label htmlFor="org-slug">
                    Slug{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional — auto-generated)
                    </span>
                  </Label>
                  <Input
                    id="org-slug"
                    placeholder="acme-corp"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating…" : "Create organization"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
