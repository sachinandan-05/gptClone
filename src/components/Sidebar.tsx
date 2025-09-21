"use client"
import { PanelLeft, Search, UserIcon, MoreHorizontal, Share, Edit, Archive, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, Plus, User, Zap } from "lucide-react"
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
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter()
  const { userId } = useAuth()
  const [chats, setChats] = useState<Array<{
    _id: string;
    title: string;
    updatedAt: string;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    chatId: string;
    chatTitle: string;
  }>({
    isOpen: false,
    chatId: '',
    chatTitle: ''
  })

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

  const handleRename = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Add your rename logic here
    console.log('Rename chat:', chatId)
  }

  const handleArchive = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Add your archive logic here
    console.log('Archive chat:', chatId)
  }

  const handleDelete = (chatId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      chatId,
      chatTitle: title
    })
  }

  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      chatId: '',
      chatTitle: ''
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.chatId) return
    
    try {
      const response = await fetch(`/api/chat/${deleteModal.chatId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove the deleted chat from the local state
        setChats(chats.filter(chat => chat._id !== deleteModal.chatId))
        // Close the modal
        cancelDelete()
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
    <>
    <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[50px] bg-[#212121] border-r border-white/10' : 'w-[259px] bg-sidebar'} font-sans text-sm font-normal leading-5 text-white`} style={{
      fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
    }}>
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
          className={`w-full justify-${isCollapsed ? 'center' : 'start'} gap-2 ${isCollapsed ? 'bg-transparent' : 'bg-[#181818]'} text-sidebar-primary-foreground hover:bg-[#212121] hover:cursor-pointer`}
        >
          <Plus size={16} />
          {!isCollapsed && "New chat"}
        </Button>
      </div>

      <div className="px-2">
        <Button 
          className={`w-full justify-${isCollapsed ? 'center' : 'start'} gap-2 px-3 py-2 p-2 text-left ${isCollapsed ? 'bg-transparent' : 'bg-[#181818]'} text-sidebar-primary-foreground hover:bg-[#212121] hover:cursor-pointer`}
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

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {isLoading ? (
            <div>
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
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
                  className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-left h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:cursor-pointer ${!isCollapsed ? 'pr-10' : ''}`}
                >
                  {isCollapsed ? (
                    <div className="" />
                  ) : (
                    <div className="flex flex-col items-start min-w-0">
                      <div className="text-sm font-medium w-full">
                        {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                      </div>
                      {/* <div className="text-xs text-white/60">{formatDate(chat.updatedAt)}</div> */}
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
                          onClick={(e) => handleRename(chat._id, e)}
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
                          onClick={(e) => handleDelete(chat._id, chat.title, e)}
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
      <div className="p-2">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mt-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer`}>
          {isCollapsed ? <UserIcon size={16}/> : <UserDropdown />}
        </div>
      </div>
    </div>

    {/* Delete Confirmation Modal */}
    {deleteModal.isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#2f2f2f] rounded-lg p-6 w-[450px] h-[175px] mx-4 flex flex-col">
          <h2 className="text-lg font-medium text-white mb-4">Delete chat?</h2>
          <p className="text-white/80 mb-2">
            This will delete <strong>{deleteModal.chatTitle}</strong>.
          </p>
          <p className="text-white/60 text-sm mb-6">
            Visit <span className="underline cursor-pointer">settings</span> to delete any memories saved during this chat.
          </p>
          <div className="flex gap-3 justify-end items-center -mt-0.5">
            <button
              onClick={cancelDelete}
              className="px-4  bg-transparent border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 bg-red-600  text-white rounded-full hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}