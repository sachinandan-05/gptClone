"use client"

import React from 'react'

interface ChatLoaderProps {
  variant?: 'default' | 'compact' | 'minimal'
  showAvatar?: boolean
  avatarSrc?: string
  className?: string
}

export default function ChatLoader({ 
  variant = 'default', 
  showAvatar = true, 
  avatarSrc,
  className = '' 
}: ChatLoaderProps) {
  
  const ChatGPTAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
      {avatarSrc ? (
        <img src={avatarSrc} alt="AI" className="w-full h-full rounded-full" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      )}
    </div>
  )

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 py-2 ${className}`}>
        {showAvatar && <ChatGPTAvatar />}
        <div className="flex items-center space-x-1">
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    )
  }

  // Default variant - full ChatGPT style
  return (
    <div className={`flex space-x-4 py-4 ${className}`}>
      {showAvatar && <ChatGPTAvatar />}
      <div className="flex-1 space-y-2">
        <div className="text-sm font-semibold text-gray-200">ChatGPT</div>
        <div className="flex items-center space-x-1">
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    </div>
  )
}

// Alternative loader with pulsing effect
export function ChatLoaderPulse({ 
  showAvatar = true, 
  className = '' 
}: { showAvatar?: boolean, className?: string }) {
  return (
    <div className={`flex space-x-4 py-4 ${className}`}>
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      )}
      <div className="flex-1 space-y-2">
        <div className="text-sm font-semibold text-gray-200">ChatGPT</div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
          <div className="w-16 h-2 bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

// Typing indicator with cursor
export function ChatLoaderTyping({ 
  showAvatar = true, 
  className = '' 
}: { showAvatar?: boolean, className?: string }) {
  return (
    <div className={`flex space-x-4 py-4 ${className}`}>
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      )}
      <div className="flex-1 space-y-2">
        <div className="text-sm font-semibold text-gray-200">ChatGPT</div>
        <div className="flex items-center">
          <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse"></span>
        </div>
      </div>
    </div>
  )
}

// Example usage component
export function LoaderDemo() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#212121] min-h-screen space-y-8">
      <h1 className="text-2xl font-bold text-white mb-8">ChatGPT Loader Variants</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Default Loader</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoader />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Compact Loader</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoader variant="compact" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Minimal Loader</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoader variant="minimal" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Pulse Loader</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoaderPulse />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Typing Cursor</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoaderTyping />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Without Avatar</h3>
          <div className="bg-[#2f2f2f] rounded-lg p-4">
            <ChatLoader showAvatar={false} />
          </div>
        </div>
      </div>
    </div>
  )
}