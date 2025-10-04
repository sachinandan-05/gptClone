"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Mic, ArrowUp, Loader2, X, FileText, FileImage } from "lucide-react"

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (content: string, fileUrl?: string, fileType?: string) => Promise<void>;
  isLoading: boolean;
  variant?: string;
  disabled?: boolean;
}

export default function ChatInput({ input, onInputChange, onSendMessage, isLoading, variant, disabled = false }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!validTypes.includes(file.type)) {
      alert("Please upload an image (JPG, PNG, GIF, WebP), PDF, or Word document")
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
  }

  const normalizeFileType = (mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf' || 
        mimeType === 'application/msword' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'document'
    }
    return 'other'
  }

  const uploadFile = async (file: File): Promise<{ url: string; type: 'image' | 'document' | 'video' | 'audio' | 'other' } | null> => {
    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const normalizedType = normalizeFileType(file.type)
      return { url: data.url, type: normalizedType }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || disabled || uploadingFile) return

    try {
      let fileUrl: string | undefined
      let fileType: string | undefined

      // Upload file if one is selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile)
        if (!uploadResult) return // Upload failed
        fileUrl = uploadResult.url
        fileType = uploadResult.type
      }

      // Send message with or without file
      await onSendMessage(input || "Analyze this file", fileUrl, fileType)
      
      // Clear file after sending
      handleRemoveFile()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault()
      handleSend()
    }
  }

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [input])

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-2 flex items-start gap-2 p-3 bg-[#2a2a2a] rounded-lg">
          {filePreview ? (
            <div className="relative">
              <img
                src={filePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-[#3a3a3a] rounded-lg">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-gray-400 text-xs">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={uploadingFile}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-[#3a3a3a] rounded-full px-3 py-2 sm:px-4 sm:py-3 shadow-lg">
        {/* Left: Plus button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={disabled || uploadingFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingFile}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base leading-6 max-h-[200px] overflow-y-auto mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Mic button (always visible) */}
        <button
          type="button"
          disabled={disabled}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-5 h-5 hover:text-white" />
        </button>

        {/* Send button (shows if input exists or file is selected) */}
        {(input.trim() || selectedFile) && (
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || disabled || uploadingFile}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
