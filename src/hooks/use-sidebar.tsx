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
    const checkMobile = window.innerWidth < 768
    
    // Set initial states without conditions to prevent unnecessary re-renders
    setIsOpen(prev => prev !== initialIsOpen ? initialIsOpen : prev)
    setIsMobile(prev => prev !== checkMobile ? checkMobile : prev)

    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(prevIsMobile => {
        if (prevIsMobile !== mobile && mobile) {
          setIsOpen(false)
          return mobile
        }
        return prevIsMobile
      })
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, []) // Empty dependency array to run only on mount

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
