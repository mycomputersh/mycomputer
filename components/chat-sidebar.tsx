"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, FolderIcon, FolderOpen, MessageSquare, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type ChatMeta,
  type FolderMeta,
  useChatSidebar,
} from "@/components/chat-sidebar-context"

// ─── Chat item ───────────────────────────────────────────────────────────────

function ChatItem({ chat }: { chat: ChatMeta }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === `/dashboard/chat/${chat.id}`
  const { folders, renameChat, removeChat, moveChatToFolder } = useChatSidebar()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === chat.title) {
      setIsRenaming(false)
      setRenameValue(chat.title)
      return
    }
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
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        isActive && "bg-accent text-accent-foreground",
      )}
    >
      {isRenaming ? (
        <Input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename()
            if (e.key === "Escape") {
              setIsRenaming(false)
              setRenameValue(chat.title)
            }
          }}
          className="h-6 flex-1 px-1.5 py-0 text-xs"
          autoFocus
        />
      ) : (
        <Link
          href={`/dashboard/chat/${chat.id}`}
          className="flex-1 truncate text-xs"
        >
          {chat.title}
        </Link>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                setIsRenaming(true)
                setRenameValue(chat.title)
              }}
            >
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>

            {/* Move to folder submenu */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleMove(null)}
              disabled={chat.folderId === null}
            >
              <MessageSquare className="mr-2 size-3.5" />
              Remove from folder
            </DropdownMenuItem>
            {folders.map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={() => handleMove(f.id)}
                disabled={chat.folderId === f.id}
              >
                <FolderIcon className="mr-2 size-3.5" />
                {f.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ─── Folder item ─────────────────────────────────────────────────────────────

function FolderItem({
  folder,
  chats,
}: {
  folder: FolderMeta
  chats: ChatMeta[]
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const { renameFolder, removeFolder } = useChatSidebar()

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === folder.name) {
      setIsRenaming(false)
      setRenameValue(folder.name)
      return
    }
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
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-xs font-medium"
        >
          <ChevronRight
            className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-90")}
          />
          {isOpen ? (
            <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") {
                  setIsRenaming(false)
                  setRenameValue(folder.name)
                }
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
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={() => {
                setIsRenaming(true)
                setRenameValue(folder.name)
              }}
            >
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isOpen && (
        <div className="ml-4 space-y-0.5">
          {chats.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">Empty</p>
          ) : (
            chats.map((c) => <ChatItem key={c.id} chat={c} />)
          )}
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
    const folder = await res.json()
    addFolder(folder)
    onDone()
  }

  return (
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit()
        if (e.key === "Escape") onDone()
      }}
      placeholder="Folder name…"
      className="mx-2 h-6 px-1.5 py-0 text-xs"
      autoFocus
    />
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function ChatSidebar() {
  const { chats, folders } = useChatSidebar()
  const [addingFolder, setAddingFolder] = useState(false)

  const folderChats = (folderId: string) =>
    chats.filter((c) => c.folderId === folderId)
  const unfiledChats = chats.filter((c) => c.folderId === null)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Chats
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setAddingFolder(true)}
            title="New folder"
          >
            <FolderIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            asChild
            title="New chat"
          >
            <Link href="/dashboard/chat">
              <Plus className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {/* Folders */}
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            chats={folderChats(folder.id)}
          />
        ))}

        {/* New folder inline input */}
        {addingFolder && (
          <NewFolderInput onDone={() => setAddingFolder(false)} />
        )}

        {/* Unfiled chats */}
        {unfiledChats.length > 0 && (
          <div className="space-y-0.5">
            {folders.length > 0 && (
              <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">
                Unfiled
              </p>
            )}
            {unfiledChats.map((c) => (
              <ChatItem key={c.id} chat={c} />
            ))}
          </div>
        )}

        {chats.length === 0 && !addingFolder && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No chats yet.
            <br />
            Start a new conversation.
          </p>
        )}
      </div>
    </div>
  )
}
