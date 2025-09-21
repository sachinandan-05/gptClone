"use client"

import { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Mic, Plus } from "lucide-react"

interface ChatInputProps {
  input?: string
  isLoading?: boolean
  disabled?: boolean
  onInputChange?: (value: string) => void
  onSendMessage?: () => void
  onFileUpload?: (files: FileList | null) => void
  className?: string
}

export default function ChatInput({
  input: externalInput,
  isLoading = false,
  disabled = false,
  onInputChange,
  onSendMessage,
  onFileUpload,
  className = ''
}: ChatInputProps) {
  const [internalInput, setInternalInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const input = externalInput !== undefined ? externalInput : internalInput

  const handleInputChange = (value: string) => {
    if (onInputChange) {
      onInputChange(value)
    } else {
      setInternalInput(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (onSendMessage) {
        onSendMessage()
      } else {
        console.log("Sending message:", input)
        setInternalInput("")
      }
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  // auto-grow textarea like ChatGPT
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="w-full max-w-4xl mx-auto p-1">
      {/* Main Input Container */}
      <div className="relative bg-[#303030] rounded-3xl shadow-lg w-[770px] px-3 py-2 flex items-end">
        {/* Plus/Add Button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={isLoading || disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Input Area */}
        <div className="flex-1 px-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              handleInputChange(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base leading-6 max-h-[200px] overflow-y-auto scrollbar-thin  scrollbar-track-transparent"
            rows={1}
          />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 flex-shrink-0 pb-1">
          <button
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center text-xs text-[#f3f3f3] mt-1">
        ChatGPT can make mistakes. Check important info.{" "}
        <button className="underline hover:text-gray-300 transition-colors">
          See Cookie Preferences.
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => onFileUpload && onFileUpload(e.target.files)}
        multiple
      />
    </div>
  )
}
