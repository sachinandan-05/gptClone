"use client"

import { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}
const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Load saved state from localStorage
    const savedState = typeof window !== 'undefined' ? localStorage.getItem('sidebarOpen') : null
    const initialIsOpen = savedState ? JSON.parse(savedState) : !(window.innerWidth < 768)
    
    // Only set initial state if it's different to prevent unnecessary re-renders
    if (isOpen !== initialIsOpen) {
      setIsOpen(initialIsOpen)
    }
    
    const checkMobile = window.innerWidth < 768
    if (isMobile !== checkMobile) {
      setIsMobile(checkMobile)
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(prevIsMobile => {
        if (prevIsMobile !== mobile) {
          return mobile
        }
        return prevIsMobile
      })
      
      // On mobile, close the sidebar when resizing to mobile
      if (mobile && isOpen) {
        setIsOpen(false)
      }
      // On desktop, ensure sidebar is open when resizing from mobile
      if (!mobile && !isOpen) {
        setIsOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Save to localStorage when isOpen changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(isOpen))
    }
  }, [isOpen])

  const toggle = () => {
    setIsOpen(!isOpen)
  }
  
  const close = () => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  
  // Return a default context if no provider is found
  if (context === undefined) {
    return {
      isOpen: false,
      toggle: () => {},
      close: () => {}
    }
  }
  
  return context
}
