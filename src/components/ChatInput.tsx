"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Paperclip, Send, Mic, Plus, X, Loader2 } from "lucide-react"
// Remove sonner toast for now to avoid dependency issues

interface ChatInputProps {
  input?: string
  isLoading?: boolean
  disabled?: boolean
  onInputChange?: (value: string) => void
  onSendMessage?: (content: string, fileUrl?: string, fileType?: 'image' | 'document' | 'video' | 'audio' | 'other') => void
  onFileUpload?: (files: FileList | null) => void
  className?: string
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

const MAX_FILE_SIZE_MB = 10; // 10MB

export default function ChatInput({
  input: externalInput,
  isLoading = false,
  disabled = false,
  onInputChange,
  onSendMessage,
  onFileUpload,
  className = ''
}: ChatInputProps) {
  const [internalInput, setInternalInput] = useState(externalInput || "")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const input = externalInput !== undefined ? externalInput : internalInput

  const handleInputChange = (value: string) => {
    if (onInputChange) {
      onInputChange(value)
    } else {
      setInternalInput(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault?.()
    const messageContent = input.trim()
    if (!messageContent && !selectedFile) return
    
    // If there's a selected file, upload it first
    if (selectedFile) {
      try {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const data = await response.json()
        const fileUrl = data.url
        const fileType: 'image' | 'document' = data.resourceType === 'image' ? 'image' : 'document'
        
        if (onSendMessage) {
          onSendMessage(messageContent, fileUrl, fileType)
          setInternalInput("")
          setSelectedFile(null)
          setPreviewUrl(null)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
      } finally {
        setIsUploading(false)
      }
    } else if (onSendMessage) {
      onSendMessage(messageContent)
      setInternalInput("")
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.error('File type not supported')
      return
    }
    
    // Validate file size (10MB)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      console.error(`File too large. Max size: ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    
    setSelectedFile(file)
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        const event = new Event('change', { bubbles: true })
        fileInputRef.current.dispatchEvent(event)
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

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      const fileUrl = data.url
      let fileType: 'image' | 'document' | 'video' | 'audio' | 'other' = 'other'
      
      if (selectedFile.type.startsWith('image/')) {
        fileType = 'image'
      } else if (selectedFile.type.startsWith('audio/')) {
        fileType = 'audio'
      } else if (selectedFile.type.startsWith('video/')) {
        fileType = 'video'
      } else if (selectedFile.type.includes('pdf') || 
                selectedFile.type.includes('text') || 
                selectedFile.type.includes('word') || 
                selectedFile.type.includes('excel') || 
                selectedFile.type.includes('sheet') || 
                selectedFile.type.includes('document')) {
        fileType = 'document'
      }
      
      if (onSendMessage) {
        onSendMessage(input.trim() || `[File: ${selectedFile.name}]`, fileUrl, fileType)
      }
      
      setInternalInput("")
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-1 px-2 sm:px-4">
      {/* File Preview */}
      {previewUrl && selectedFile?.type.startsWith('image/') && (
        <div className="relative mb-2 w-full max-w-3xl mx-auto">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-40 max-w-full rounded-lg object-contain border border-gray-600"
            />
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1 hover:bg-gray-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
      
      {selectedFile && !selectedFile.type.startsWith('image/') && (
        <div className="relative mb-2 w-full max-w-3xl mx-auto px-2 sm:px-4">
          <div className="inline-flex items-center bg-gray-800 rounded-lg px-3 py-2 border border-gray-600 w-full">
            <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-200 truncate flex-1 max-w-[200px] sm:max-w-md">
              {selectedFile.name}
            </span>
            <button
              onClick={removeFile}
              className="ml-2 text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-[#303030] rounded-3xl shadow-lg w-full max-w-3xl mx-auto px-2 py-1.5 sm:px-3 sm:py-2 flex items-end ${
          isDragging ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={ALLOWED_FILE_TYPES.join(',')}
        />
        
        {/* Plus/Add Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled || isUploading}
          className="flex-shrink-0 p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Attach file"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
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
            className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-sm sm:text-base leading-6 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-transparent pr-1"
            rows={1}
          />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 flex-shrink-0 pb-1">
          <button
            type="button"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || disabled || isUploading}
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || disabled || isUploading || (!input?.trim() && !selectedFile)}
            className={`p-1.5 sm:p-2 text-white rounded-full transition-colors ${
              (input?.trim() || selectedFile) && !isLoading && !isUploading
                ? 'bg-none hover:bg-gray-600'
                : 'bg-none cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            {isLoading || isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
    </div>
    </div>
  )
}