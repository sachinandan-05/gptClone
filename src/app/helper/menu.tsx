import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "../ui/dropdown-menu"
  import { Button } from "../ui/button"
  import {
    User,
    LogOut,
    Star,
    Clock,
    Settings,
    HelpCircle,
    ChevronRight,
  } from "lucide-react"
  import { useUser, useClerk } from "@clerk/nextjs"
  import { useRouter } from "next/navigation"
  
  interface UserDropdownProps {
  isCollapsed?: boolean;
}

export function UserDropdown({ isCollapsed = false }: UserDropdownProps) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const router = useRouter()
    
    const handleSignOut = async () => {
      await signOut()
      router.push('/')
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'justify-between px-2 py-1 w-full'} hover:bg-gray-800 rounded-md`}
          >
            {!isCollapsed ? (
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                {/* User info */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-white">
                    {user?.username || user?.fullName || 'User'}
                  </span>
                  <span className="text-xs text-gray-400">Free Plan</span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User size={16} />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
  
        <DropdownMenuContent
          className="w-64 rounded-xl p-1 bg-[#2d2d2d] text-white"
          align="start"
        >
          {/* Top: Email */}
          <DropdownMenuLabel className="px-2 py-1 text-gray-400 text-sm font-normal">
            {user?.primaryEmailAddress?.emailAddress || 'User Email'}
          </DropdownMenuLabel>
  
          <DropdownMenuSeparator className="bg-gray-700" />
  
          {/* Options */}
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 rounded-md">
            <Star size={16} />
            <span>Upgrade plan</span>
          </DropdownMenuItem>
  
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 rounded-md">
            <Clock size={16} />
            <span>Personalization</span>
          </DropdownMenuItem>
  
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 rounded-md">
            <Settings size={16} />
            <span>Settings</span>
          </DropdownMenuItem>
  
          <DropdownMenuSeparator className="bg-gray-700" />
  
          {/* Help with Chevron */}
          <DropdownMenuItem className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-700 rounded-md">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} />
              <span>Help</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </DropdownMenuItem>
  
          {/* User info and Logout */}
          <div className="px-3 py-2">
            <div className="text-sm text-gray-400 mb-1">
              {user?.username || user?.fullName || 'User'}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {user?.primaryEmailAddress?.emailAddress }
            </div>
            <DropdownMenuItem 
              className="flex items-center gap-2 px-0 py-1 cursor-pointer hover:bg-gray-700 rounded-md text-red-400"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  