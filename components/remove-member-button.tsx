"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Props = { memberId: string; memberName: string }

export function RemoveMemberButton({ memberId, memberName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function remove() {
    if (!confirm(`Remove ${memberName} from this organization?`)) return
    setLoading(true)
    await authClient.organization.removeMember({ memberIdOrEmail: memberId })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive h-7 px-2"
      disabled={loading}
      onClick={remove}
    >
      Remove
    </Button>
  )
}
