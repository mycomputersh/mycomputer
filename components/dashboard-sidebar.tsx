"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useState } from "react"
import {
  LayoutDashboard, Users, MessageSquare, Store, Settings,
  LogOut, FolderIcon, FolderOpen, ChevronRight, MoreHorizontal,
  Pencil, Trash2, Plus,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/org-switcher"
import { authClient } from "@/lib/auth-client"
import {
  type ChatMeta,
  type FolderMeta,
  useChatSidebar,
} from "@/components/chat-sidebar-context"

type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}

type Props = {
  organizations: Organization[]
  activeOrg: Organization | null
  user: { name: string; email: string; image?: string | null }
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function userInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

// ─── Chat item ────────────────────────────────────────────────────────────────

function ChatItem({ chat }: { chat: ChatMeta }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === `/dashboard/chat/${chat.id}`
  const { folders, renameChat, removeChat, moveChatToFolder } = useChatSidebar()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === chat.title) { setIsRenaming(false); setRenameValue(chat.title); return }
    await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    })
    renameChat(chat.id, trimmed)
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    await fetch(`/api/chats/${chat.id}`, { method: "DELETE" })
    removeChat(chat.id)
    if (isActive) router.push("/dashboard/chat")
  }

  const handleMove = async (folderId: string | null) => {
    await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    })
    moveChatToFolder(chat.id, folderId)
  }

  return (
    <div className={cn(
      "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
      isActive && "bg-accent text-accent-foreground",
    )}>
      {isRenaming ? (
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename()
            if (e.key === "Escape") { setIsRenaming(false); setRenameValue(chat.title) }
          }}
          className="h-6 flex-1 px-1.5 py-0 text-xs"
          autoFocus
        />
      ) : (
        <Link href={`/dashboard/chat/${chat.id}`} className="flex-1 truncate text-xs">
          {chat.title}
        </Link>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-5 shrink-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => { setIsRenaming(true); setRenameValue(chat.title) }}>
              <Pencil className="mr-2 size-3.5" />Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleMove(null)} disabled={chat.folderId === null}>
              <MessageSquare className="mr-2 size-3.5" />Remove from folder
            </DropdownMenuItem>
            {folders.map((f) => (
              <DropdownMenuItem key={f.id} onClick={() => handleMove(f.id)} disabled={chat.folderId === f.id}>
                <FolderIcon className="mr-2 size-3.5" />{f.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 size-3.5" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ─── Folder item ──────────────────────────────────────────────────────────────

function FolderItem({ folder, chats }: { folder: FolderMeta; chats: ChatMeta[] }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const { renameFolder, removeFolder } = useChatSidebar()

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === folder.name) { setIsRenaming(false); setRenameValue(folder.name); return }
    await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    renameFolder(folder.id, trimmed)
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    await fetch(`/api/folders/${folder.id}`, { method: "DELETE" })
    removeFolder(folder.id)
  }

  return (
    <div>
      <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent">
        <button onClick={() => setIsOpen((v) => !v)} className="flex flex-1 items-center gap-1.5 text-xs font-medium">
          <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-90")} />
          {isOpen
            ? <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
            : <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />}
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") { setIsRenaming(false); setRenameValue(folder.name) }
              }}
              className="h-5 flex-1 px-1 py-0 text-xs"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate text-left">{folder.name}</span>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-5 shrink-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => { setIsRenaming(true); setRenameValue(folder.name) }}>
              <Pencil className="mr-2 size-3.5" />Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 size-3.5" />Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isOpen && (
        <div className="ml-4 space-y-0.5">
          {chats.length === 0
            ? <p className="px-2 py-1 text-xs text-muted-foreground">Empty</p>
            : chats.map((c) => <ChatItem key={c.id} chat={c} />)}
        </div>
      )}
    </div>
  )
}

// ─── New folder input ─────────────────────────────────────────────────────────

function NewFolderInput({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("")
  const { addFolder } = useChatSidebar()

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) { onDone(); return }
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    addFolder(await res.json())
    onDone()
  }

  return (
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onDone() }}
      placeholder="Folder name…"
      className="mx-2 h-6 px-1.5 py-0 text-xs"
      autoFocus
    />
  )
}

// ─── Chat history section ─────────────────────────────────────────────────────

function ChatHistory() {
  const { chats, folders } = useChatSidebar()
  const [addingFolder, setAddingFolder] = useState(false)

  const folderChats = (folderId: string) => chats.filter((c) => c.folderId === folderId)
  const unfiledChats = chats.filter((c) => c.folderId === null)

  return (
    <div className="flex flex-col gap-1">
      {/* Section header */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chats
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-5" onClick={() => setAddingFolder(true)} title="New folder">
            <FolderIcon className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-5" asChild title="New chat">
            <Link href="/dashboard/chat"><Plus className="size-3" /></Link>
          </Button>
        </div>
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} chats={folderChats(folder.id)} />
      ))}

      {/* New folder inline input */}
      {addingFolder && <NewFolderInput onDone={() => setAddingFolder(false)} />}

      {/* Unfiled chats */}
      {unfiledChats.length > 0 && (
        <div className="space-y-0.5">
          {folders.length > 0 && (
            <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">Unfiled</p>
          )}
          {unfiledChats.map((c) => <ChatItem key={c.id} chat={c} />)}
        </div>
      )}

      {chats.length === 0 && !addingFolder && (
        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
          No chats yet.<br />Start a new conversation.
        </p>
      )}
    </div>
  )
}

// ─── Dashboard sidebar ────────────────────────────────────────────────────────

export function DashboardSidebar({ organizations, activeOrg, user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <OrgSwitcher organizations={organizations} activeOrg={activeOrg} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main nav */}
        <SidebarMenu>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={href}>
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

        {/* Chat history */}
        <ChatHistory />
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent">
              <Avatar className="size-8 shrink-0">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback className="text-xs">{userInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
