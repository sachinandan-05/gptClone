"use client"
import { PanelLeft, Search, UserIcon, MoreHorizontal, Share, Edit, Archive, Trash2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { UserDropdown } from "@/app/helper/menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onClose }: SidebarProps) {
  const router = useRouter()
  const { userId } = useAuth()
  const [chats, setChats] = useState<Array<{
    _id: string;
    title: string;
    updatedAt: string;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [renamingChat, setRenamingChat] = useState<{
    id: string;
    title: string;
  } | null>(null)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    const fetchChats = async () => {
      if (!userId) return
      
      try {
        const response = await fetch('/api/chat')
        if (response.ok) {
          const data = await response.json()
          setChats(data)
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [userId])

  const handleShare = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Add your share logic here
    console.log('Share chat:', chatId)
  }

  const handleRename = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingChat({ id: chatId, title: currentTitle })
    setNewTitle(currentTitle)
  }

  const cancelRename = () => {
    setRenamingChat(null)
    setNewTitle('')
  }

  const saveRename = async () => {
    if (!renamingChat || !newTitle.trim()) return
    
    try {
      const response = await fetch(`/api/chat/${renamingChat.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() })
      })
      
      if (response.ok) {
        // Update the chat title in the local state
        setChats(chats.map(chat => 
          chat._id === renamingChat.id 
            ? { ...chat, title: newTitle.trim() } 
            : chat
        ))
        setRenamingChat(null)
        setNewTitle('')
      } else {
        console.error('Failed to rename chat')
      }
    } catch (error) {
      console.error('Error renaming chat:', error)
    }
  }

  const handleArchive = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Add your archive logic here
    console.log('Archive chat:', chatId)
  }

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove the deleted chat from the local state
        setChats(chats.filter(chat => chat._id !== chatId))
      } else {
        console.error('Failed to delete chat')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const toggleSidebar = () => {
    onToggleCollapse();
  }

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[50px] bg-[#212121] border-r border-white/10' : 'w-[259px] lg:w-[259px] bg-sidebar'} font-sans text-sm font-normal leading-5 text-white`}>
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-2 border-b border-white/10">
        <h2 className="text-white font-medium">ChatGPT</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* Logo and Collapse Button */}
      <div className="flex items-center justify-between p-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img 
              src="/image.png" 
              alt="Logo" 
              className="h-6 w-6 rounded-sm filter brightness-0 invert" 
            />
            {/* <span className="font-semibold text-white">ChatGPT</span> */}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-8 w-8 ml-auto"
        >
          {isCollapsed ? (
            <div className="group relative h-6 w-6 flex items-center justify-center">
              <img 
                src="/image.png" 
                alt="Logo" 
                className="h-6 w-6 rounded-sm filter brightness-0 invert group-hover:opacity-0 transition-opacity" 
              />
              <PanelLeft className="absolute h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <PanelLeft className="h-4 w-4 transform rotate-180" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-2">
        <Button 
          onClick={() => router.push('/')}
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2 ${isCollapsed ? 'bg-transparent' : 'bg-[#181818]'} text-sidebar-primary-foreground hover:bg-[#212121]`}
        >
          <Plus size={16} />
          {!isCollapsed && "New chat"}
        </Button>
      </div>

      <div className="px-2">
        <Button 
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2 p-2 text-left ${isCollapsed ? 'bg-transparent' : 'bg-[#181818]'} text-sidebar-primary-foreground hover:bg-[#212121]`}
        >
          <Search size={16}/>
          {!isCollapsed && "Search chats"}
        </Button>
      </div>

      {isCollapsed ? (
        <div className="">
        </div>
      ) : (
        <div className="px-5 text-sm font-medium text-[#747474]">
          <span>Chats</span>
        </div>
      )}

      {/* Chats List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`group relative w-full ${isCollapsed ? 'flex justify-center' : ''}`}
              >
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/chat/${chat._id}`)}
                  className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} text-left h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent ${!isCollapsed ? 'pr-10' : ''}`}
                >
                  {!isCollapsed && (
                    <div className="flex flex-col items-start min-w-0">
                      <div className="text-sm font-medium w-full truncate">
                        {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                      </div>
                    </div>
                  )}
                </Button>
                
                {!isCollapsed && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-[#212121]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        className="w-48 bg-[#2f2f2f] border-[#404040] text-white"
                        align="start"
                        side="right"
                      >
                        <DropdownMenuItem 
                          className="flex items-center gap-2 hover:bg-[#404040] cursor-pointer"
                          onClick={(e) => handleShare(chat._id, e)}
                        >
                          <Share className="h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 hover:bg-[#404040] cursor-pointer"
                          onClick={(e) => handleRename(chat._id, chat.title, e)}
                        >
                          <Edit className="h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 hover:bg-[#404040] cursor-pointer"
                          onClick={(e) => handleArchive(chat._id, e)}
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 hover:bg-[#404040] cursor-pointer text-red-400 hover:text-red-300"
                          onClick={(e) => handleDelete(chat._id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))
          ) : (
            !isCollapsed && (
              <div className="px-3 py-2 text-sm text-sidebar-foreground/60">
                No chats yet
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-2 mt-auto">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-md hover:bg-sidebar-accent cursor-pointer`}>
          {isCollapsed ? <UserIcon size={16}/> : <UserDropdown />}
        </div>
      </div>

      {/* Rename Modal */}
      {renamingChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2f2f2f] rounded-lg p-6 w-[450px] mx-4">
            <h2 className="text-lg font-medium text-white mb-4">Rename chat</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#404040] text-white border border-white/20 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') cancelRename()
              }}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
                onClick={cancelRename}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={saveRename}
                disabled={!newTitle.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
