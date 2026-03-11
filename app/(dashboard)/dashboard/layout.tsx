import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chatFolders, chats } from "@/db/chat-schema"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ChatSidebarProvider } from "@/components/chat-sidebar-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const orgsResult = await auth.api.listOrganizations({
    headers: await headers(),
  })
  const organizations = orgsResult ?? []

  const activeOrg =
    organizations.find((o) => o.id === session.session.activeOrganizationId) ??
    organizations[0]

  if (activeOrg && !session.session.activeOrganizationId) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: activeOrg.id },
    })
    redirect("/dashboard")
  }

  const orgId = activeOrg?.id ?? "personal"

  const [folderRows, chatRows] = await Promise.all([
    db
      .select({ id: chatFolders.id, name: chatFolders.name })
      .from(chatFolders)
      .where(eq(chatFolders.organizationId, orgId))
      .orderBy(chatFolders.createdAt),
    db
      .select({
        id: chats.id,
        title: chats.title,
        folderId: chats.folderId,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(eq(chats.organizationId, orgId))
      .orderBy(desc(chats.updatedAt)),
  ])

  return (
    <ChatSidebarProvider initialFolders={folderRows} initialChats={chatRows}>
      <SidebarProvider>
        <DashboardSidebar
          organizations={organizations}
          activeOrg={activeOrg}
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
        <SidebarInset className="overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ChatSidebarProvider>
  )
}
