"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { useState } from "react"

interface UserDropdownProps {
  isCollapsed?: boolean
}

export function UserDropdown({ isCollapsed = false }: UserDropdownProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSigningOut) return
    setIsSigningOut(true)

    // Clear all cookies first
    const clearAllCookies = () => {
      const cookies = document.cookie.split(";")
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
        // Clear for all possible paths and domains
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      }
    }

    clearAllCookies()

    // Clear storage
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.warn("Storage clear error:", e)
    }

    // Sign out from Clerk without waiting (to avoid server action errors)
    signOut({ redirectUrl: "/" }).catch((err) => {
      console.warn("Clerk signOut error (ignored):", err)
    })

    // Immediate redirect
    window.location.href = "/"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center ${
            isCollapsed
              ? "justify-center p-1"
              : "justify-between px-2 py-1 w-full"
          } hover:bg-[#2d2d2d] hover:cursor-pointer rounded-md`}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-2 ">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full cursor-pointer bg-gray-600 flex items-center justify-center">
                <User size={16} />
              </div>
              {/* User info */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">
                  {user?.username || user?.fullName || "User"}
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
        className="w-64 rounded-xl p-1 bg-[#202123] text-white"
        align="start"
      >
        {/* Top: Email */}
        <DropdownMenuLabel className="px-2 py-1 text-gray-400 text-sm font-normal">
          {user?.primaryEmailAddress?.emailAddress || "User Email"}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#2d2d2d]" />

        {/* Options */}
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2d2d2d] rounded-md">
          <Star size={16} />
          <span>Upgrade plan</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2d2d2d] rounded-md">
          <Clock size={16} />
          <span>Personalization</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2d2d2d] rounded-md">
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
            {user?.username || user?.fullName || "User"}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {user?.primaryEmailAddress?.emailAddress}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 w-full justify-start px-0 py-1 cursor-pointer hover:bg-gray-700 rounded-md text-red-400 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={handleSignOut}
            disabled={isSigningOut}
            title={isSigningOut ? "Signing out..." : "Sign out of your account"}
          >
            <LogOut size={16} className={isSigningOut ? "animate-spin" : ""} />
            <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
