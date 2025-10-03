"use client"
import { PanelLeft, Search, UserIcon,SquarePen, MoreHorizontal, Share, Edit, Archive, Trash2, X, MessageCircle, ChevronRight, ChevronDown, FolderOpen, Layers } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GoPencil } from "react-icons/go"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { UserDropdown } from "@/app/helper/menu"
import { FaArrowRight ,} from "react-icons/fa6";
import { FaArrowLeft } from "react-icons/fa";
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
  onNewChat?: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onClose, onNewChat }: SidebarProps) {
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
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatsExpanded, setChatsExpanded] = useState(true)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchMode(true)
      }
      // Cmd+Shift+O or Ctrl+Shift+O for new chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'o') {
        e.preventDefault()
        onNewChat ? onNewChat() : router.push('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewChat, router])

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
    <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[50px] bg-[#212121] border-r border-white/5' : 'w-[260px] lg:w-[260px] bg-[#171717]'} border-r border-white/5 font-sans text-sm font-normal leading-5 text-white`}>
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img 
            src="/image.png" 
            alt="Logo" 
            className="h-8 w-8 rounded-sm filter brightness-0 invert" 
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 hover:bg-white/10 transition-colors rounded-lg">
          <X className="h-6 w-6 text-white" />
        </Button>
      </div>
      {/* Logo and Collapse Button - Desktop only */}
      <div className="hidden lg:flex items-center justify-between p-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img 
              src="/image.png" 
              alt="Logo" 
              className="h-6 w-6 rounded-sm filter brightness-0 invert" 
            />
            <span className="font-semibold text-white text-lg">ChatGPT</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={`h-8 w-8 ml-auto hover:bg-white/10 transition-colors ${isCollapsed ? 'hover:cursor-e-resize' : 'hover:cursor-w-resize'}`}
        >
          {isCollapsed ? (
            <div className="group relative h-6 w-6 flex items-center justify-center">
              <img 
                src="/image.png" 
                alt="Logo" 
                className="h-5 w-5 rounded-sm filter brightness-0 invert group-hover:opacity-0 transition-opacity" 
              />
              <PanelLeft className="absolute h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/70" />
            </div>
          ) : (
            <PanelLeft className="h-4 w-4 transform rotate-180 text-white/70" />
          )}
        </Button>
      </div>

      {/* Menu Items */}
      {!isCollapsed && (
        <div className="px-3 space-y-1">
          {/* New Chat */}
          <Button 
            onClick={() => onNewChat ? onNewChat() : router.push('/')}
            className="w-full justify-between gap-3 px-3 py-2.5 bg-transparent text-white hover:bg-white/5 transition-colors rounded-lg font-normal cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <SquarePen size={20} className="flex-shrink-0" />
              <span className="text-base">New chat</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/50">
              <span className="text-xs">⌘</span>
              <span className="text-xs">⇧</span>
              <span className="text-xs">O</span>
            </div>
          </Button>

          {/* Search Chats */}
          <Button 
            className="w-full justify-between gap-3 px-3 py-2.5 bg-transparent text-white hover:bg-white/5 transition-colors rounded-lg font-normal cursor-pointer group"
            onClick={() => setSearchMode(true)}
          >
            <div className="flex items-center gap-3">
              <Search size={18} className="flex-shrink-0"/>
              <span className="text-base">Search chats</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/50">
              <span className="text-xs">⌘</span>
              <span className="text-xs">K</span>
            </div>
          </Button>

          {/* Library */}
          <Button 
            className="w-full justify-start gap-3 px-3 py-2.5 bg-transparent text-white hover:bg-white/5 transition-colors rounded-lg font-normal"
          >
            <Layers size={18} className="flex-shrink-0"/>
            Library
          </Button>

          {/* Projects with NEW badge */}
          <Button 
            className="w-full justify-between px-3 py-2.5 bg-transparent text-white hover:bg-white/5 transition-colors rounded-lg font-normal"
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={18} className="flex-shrink-0"/>
              Projects
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/70 font-medium">NEW</span>
          </Button>
        </div>
      )}

      {/* Collapsed state icons */}
      {isCollapsed && (
        <div className="px-2 space-y-2 flex flex-col items-center">
          <Button 
            onClick={() => onNewChat ? onNewChat() : router.push('/')}
            className="h-9 w-9 p-0 bg-transparent text-white hover:bg-white/10 transition-colors rounded-lg"
          >
            <GoPencil size={18} />
          </Button>
          <Button 
            onClick={() => setSearchMode(true)}
            className="h-9 w-9 p-0 bg-transparent text-white hover:bg-white/10 transition-colors rounded-lg"
          >
            <Search size={18} />
          </Button>
          <Button 
            className="h-9 w-9 p-0 bg-transparent text-white hover:bg-white/10 transition-colors rounded-lg"
          >
            <Layers size={18} />
          </Button>
          <Button 
            className="h-9 w-9 p-0 bg-transparent text-white hover:bg-white/10 transition-colors rounded-lg"
          >
            <FolderOpen size={18} />
          </Button>
        </div>
      )}



      {/* Chats Section */}
      {!searchMode && !isCollapsed && (
        <>
          {/* Chats Header - Collapsible */}
          <div className="px-2 mt-6 mb-2">
            <Button
              onClick={() => setChatsExpanded(!chatsExpanded)}
              className="w-full justify-start gap-2 px-3 py-2 bg-transparent text-white/70 hover:bg-white/5 transition-colors rounded-lg font-normal"
            >
                <span className="text-sm cursor-pointer">Chats</span>
              {chatsExpanded ? (
                <ChevronDown size={16} className="flex-shrink-0" />
              ) : (
                <ChevronRight size={16} className="flex-shrink-0" />
              )}
            
            </Button>
          </div>

          {/* Chats List */}
          {chatsExpanded && (
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-0.5 pb-2">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                <div
                  key={chat._id}
                  className="group relative hover:cursor-pointer"
                >
                  {renamingChat?.id === chat._id ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename()
                          if (e.key === 'Escape') cancelRename()
                        }}
                        onBlur={saveRename}
                        className="flex-1 bg-[#2a2a2a] text-white text-sm px-2 py-1 rounded border border-white/20 outline-none focus:border-white/40"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push(`/chat/${chat._id}`)}
                        className="w-full justify-start px-3 py-2 text-left h-auto text-white/80 hover:bg-white/5 transition-colors rounded-lg group bg-transparent cursor-pointer"
                      >
                        <div className="flex items-center min-w-0 w-full">
                          <div className="text-sm font-normal w-full truncate group-hover:text-white transition-colors">
                            {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                          </div>
                        </div>
                      </Button>
                      
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/10 hover:cursor-pointer rounded-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="w-48 bg-[#2c2c2c] border-white/10 text-white shadow-lg z-50"
                          align="end"
                          side="right"
                          sideOffset={5}
                        >
                          <DropdownMenuItem 
                            className="flex items-center gap-3 hover:bg-white/10 cursor-pointer px-3 py-2 text-sm transition-colors"
                            onClick={(e) => handleShare(chat._id, e)}
                          >
                            <Share className="h-4 w-4 text-white/60" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-3 hover:bg-white/10 cursor-pointer px-3 py-2 text-sm transition-colors"
                            onClick={(e) => handleRename(chat._id, chat.title, e)}
                          >
                            <Edit className="h-4 w-4 text-white/60" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-3 hover:bg-white/10 cursor-pointer px-3 py-2 text-sm transition-colors"
                            onClick={(e) => handleArchive(chat._id, e)}
                          >
                            <Archive className="h-4 w-4 text-white/60" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-3 hover:bg-red-500/20 cursor-pointer px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                            onClick={(e) => handleDelete(chat._id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    </>
                  )}
                </div>
                  ))
                ) : (
              <div className="px-3 py-8 text-center text-sm text-white/40">
                No chats yet
              </div>
            )}
          </div>
        </ScrollArea>
          )}
        </>
      )}

      {/* Bottom Section */}
      <div className="p-3 mt-auto  ">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors`}>
          {isCollapsed ? <UserIcon size={18} className="text-white/70"/> : <UserDropdown />}
        </div>
      </div>

      {/* Search Modal */}
      {searchMode && (
        <div className="fixed inset-0 bg-[#212121] lg:bg-black/60 lg:flex lg:items-center lg:justify-center z-50">
          <div className="bg-[#212121] lg:bg-[#2c2c2c] lg:rounded-2xl w-full lg:w-[680px] h-full lg:h-[440px] lg:mx-4 lg:shadow-2xl lg:border lg:border-white/10 flex flex-col">
            {/* Search Header */}
            <div className="p-4 lg:p-4 border-b border-white/10">
              <div className="flex items-center gap-3 lg:px-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-base lg:text-base"
                  autoFocus
                />
                <button 
                  onClick={() => { setSearchMode(false); setSearchQuery(''); }} 
                  className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div 
              className="flex-1 px-3 lg:p-4 py-4 max-h-full overflow-y-auto custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
              }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/40"></div>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-3">
                  {/* New Chat Button */}
                  <div className="bg-white/5 lg:bg-transparent rounded-lg lg:rounded-xl">
                    <Button 
                      onClick={() => {
                        setSearchMode(false);
                        setSearchQuery('');
                        onNewChat ? onNewChat() : router.push('/');
                      }}
                      className="w-full justify-start gap-3 px-4 py-3.5 lg:py-3 bg-transparent text-white hover:bg-white/10 transition-colors rounded-lg lg:rounded-xl text-base font-normal"
                    >
                      <SquarePen size={20} className="flex-shrink-0 cursor-pointer" />
                      New chat
                    </Button>
                  </div>
                  {/* Today Section */}
                  {chats.filter(chat => {
                    if (!searchQuery) return true;
                    return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                  }).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-normal text-white/40 text-sm px-2 py-1">Today</div>
                      <div className="space-y-0.5">
                        {chats.filter(chat => {
                          if (!searchQuery) return true;
                          return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                        }).slice(0, 2).map((chat) => (
                          <Button
                            key={chat._id}
                            variant="ghost"
                            onClick={() => {
                              setSearchMode(false);
                              setSearchQuery('');
                              router.push(`/chat/${chat._id}`);
                            }}
                            className="w-full justify-start gap-3 px-4 py-3 text-left h-auto text-white/80 hover:bg-white/5 transition-colors rounded-lg group bg-transparent cursor-pointer"
                          >
                            <MessageCircle size={18} className="flex-shrink-0 text-white/60" />
                            <div className="flex flex-col items-start min-w-0 w-full">
                              <div className="text-base font-normal w-full truncate group-hover:text-white transition-colors">
                                {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday Section */}
                  {chats.filter(chat => {
                    if (!searchQuery) return true;
                    return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                  }).length > 2 && (
                    <div className="space-y-1.5">
                      <div className="font-normal text-white/40 text-sm px-2 py-1">Yesterday</div>
                      <div className="space-y-0.5">
                        {chats.filter(chat => {
                          if (!searchQuery) return true;
                          return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                        }).slice(2, 3).map((chat) => (
                          <Button
                            key={chat._id}
                            variant="ghost"
                            onClick={() => {
                              setSearchMode(false);
                              setSearchQuery('');
                              router.push(`/chat/${chat._id}`);
                            }}
                            className="w-full justify-start gap-3 px-4 py-3 text-left h-auto text-white/80 hover:bg-white/5 transition-colors rounded-lg group bg-transparent"
                          >
                            <MessageCircle size={18} className="flex-shrink-0 text-white/60" />
                            <div className="flex flex-col items-start min-w-0 w-full">
                              <div className="text-base font-normal w-full truncate group-hover:text-white transition-colors">
                                {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous 7 Days Section */}
                  {chats.filter(chat => {
                    if (!searchQuery) return true;
                    return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                  }).length > 3 && (
                    <div className="space-y-1.5">
                      <div className="font-normal text-white/40 text-sm px-2 py-1">Previous 7 Days</div>
                      <div className="space-y-0.5">
                        {chats.filter(chat => {
                          if (!searchQuery) return true;
                          return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                        }).slice(3, 4).map((chat) => (
                          <Button
                            key={chat._id}
                            variant="ghost"
                            onClick={() => {
                              setSearchMode(false);
                              setSearchQuery('');
                              router.push(`/chat/${chat._id}`);
                            }}
                            className="w-full justify-start gap-3 px-4 py-3 text-left h-auto text-white/80 hover:bg-white/5 transition-colors rounded-lg group bg-transparent"
                          >
                            <MessageCircle size={18} className="flex-shrink-0 text-white/60" />
                            <div className="flex flex-col items-start min-w-0 w-full">
                              <div className="text-base font-normal w-full truncate group-hover:text-white transition-colors">
                                {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous 30 Days Section */}
                  {chats.filter(chat => {
                    if (!searchQuery) return true;
                    return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                  }).length > 4 && (
                    <div className="space-y-1.5">
                      <div className="font-normal text-white/40 text-sm px-2 py-1">Previous 30 Days</div>
                      <div className="space-y-0.5">
                        {chats.filter(chat => {
                          if (!searchQuery) return true;
                          return (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase());
                        }).slice(4).map((chat) => (
                          <Button
                            key={chat._id}
                            variant="ghost"
                            onClick={() => {
                              setSearchMode(false);
                              setSearchQuery('');
                              router.push(`/chat/${chat._id}`);
                            }}
                            className="w-full justify-start gap-3 px-4 py-3 text-left h-auto text-white/80 hover:bg-white/5 transition-colors rounded-lg group bg-transparent"
                          >
                            <MessageCircle size={18} className="flex-shrink-0 text-white/60" />
                            <div className="flex flex-col items-start min-w-0 w-full">
                              <div className="text-base font-normal w-full truncate group-hover:text-white transition-colors">
                                {chat.title ? chat.title.charAt(0).toUpperCase() + chat.title.slice(1) : 'New Chat'}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && chats.filter(chat => 
                    (chat.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-12 text-white/50">
                      <div className="text-base">No chats found</div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!searchQuery && chats.length === 0 && (
                    <div className="text-center py-12 text-white/50">
                      <div className="text-base">No chats yet</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  )
}