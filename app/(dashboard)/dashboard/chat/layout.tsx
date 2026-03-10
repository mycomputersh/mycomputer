import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { chatFolders, chats } from "@/db/chat-schema"
import { ChatSidebarProvider } from "@/components/chat-sidebar-context"
import { ChatSidebar } from "@/components/chat-sidebar"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  const orgId = session?.session.activeOrganizationId ?? "personal"

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
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r overflow-hidden flex flex-col">
          <ChatSidebar />
        </aside>

        {/* Chat area */}
        <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      </div>
    </ChatSidebarProvider>
  )
}
