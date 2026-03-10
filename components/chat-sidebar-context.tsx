"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

export type ChatMeta = {
  id: string
  title: string
  folderId: string | null
  updatedAt: Date | string
}

export type FolderMeta = {
  id: string
  name: string
}

type ChatSidebarCtx = {
  chats: ChatMeta[]
  folders: FolderMeta[]
  addChat: (chat: ChatMeta) => void
  removeChat: (id: string) => void
  renameChat: (id: string, title: string) => void
  moveChatToFolder: (id: string, folderId: string | null) => void
  addFolder: (folder: FolderMeta) => void
  removeFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
}

const ChatSidebarContext = createContext<ChatSidebarCtx | null>(null)

export function ChatSidebarProvider({
  children,
  initialChats,
  initialFolders,
}: {
  children: ReactNode
  initialChats: ChatMeta[]
  initialFolders: FolderMeta[]
}) {
  const [chats, setChats] = useState<ChatMeta[]>(initialChats)
  const [folders, setFolders] = useState<FolderMeta[]>(initialFolders)

  const addChat = useCallback((chat: ChatMeta) => {
    setChats((prev) => [chat, ...prev])
  }, [])

  const removeChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameChat = useCallback((id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }, [])

  const moveChatToFolder = useCallback(
    (id: string, folderId: string | null) => {
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, folderId } : c)),
      )
    },
    [],
  )

  const addFolder = useCallback((folder: FolderMeta) => {
    setFolders((prev) => [...prev, folder])
  }, [])

  const removeFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    // Move chats that were in this folder to unfiled
    setChats((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)),
    )
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
  }, [])

  return (
    <ChatSidebarContext.Provider
      value={{
        chats,
        folders,
        addChat,
        removeChat,
        renameChat,
        moveChatToFolder,
        addFolder,
        removeFolder,
        renameFolder,
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  )
}

export function useChatSidebar() {
  const ctx = useContext(ChatSidebarContext)
  if (!ctx) throw new Error("useChatSidebar must be used within ChatSidebarProvider")
  return ctx
}
