"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Example SVG icons similar to ChatGPT Go & ChatGPT icons
const ChatGPTGoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-300">
    <path d="M12 2l9 5v10l-9 5-9-5V7z" strokeWidth="1.5" />
  </svg>
)

const ChatGPTIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-300">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
  </svg>
)

interface DropdownMenuCheckboxesProps {
  selected: string;
  setSelected: (value: string) => void;
}

export function DropdownMenuCheckboxes({ selected, setSelected }: DropdownMenuCheckboxesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
        
        
          className="w-[120px] hover:cursor-pointer hover:bg-[#3a3a3a] text-white rounded-md   py-2 flex items-center  px-2 justify-between"
        >
          {selected}
          <ChevronDown className="h-4 w-4 text-gray-300 mr-[10px]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[280px] bg-[#2f2f2f] text-white border border-[#3f3f3f] rounded-xl shadow-lg p-1 hover:cursor-pointer hover:bg-[#3a3a3a]"
      >
        {/* ChatGPT Go */}
        <DropdownMenuItem
          onClick={() => setSelected("ChatGPT Go")}
          className="flex justify-between items-center hover:bg-[#3a3a3a] px-3 py-3 rounded-lg cursor-pointer hover:bg-[#3a3a3a]"
        >
          <div className="flex items-center space-x-3 ">
            <ChatGPTGoIcon />
            <div className="flex flex-col">
              <span className="font-medium">ChatGPT Go</span>
              <span className="text-xs text-gray-400">
                Our smartest model & more
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-[#3a3a3a] text-white border-0 px-3 py-1 text-xs"
          >
            Upgrade
          </Button>
        </DropdownMenuItem>

        {/* ChatGPT */}
        <DropdownMenuItem
          onClick={() => setSelected("ChatGPT")}
          className="flex justify-between items-center hover:bg-[#3a3a3a] px-3 py-3 rounded-lg cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <ChatGPTIcon />
            <div className="flex flex-col">
              <span className="font-medium">ChatGPT</span>
              <span className="text-xs text-gray-400">
                Great for everyday tasks
              </span>
            </div>
          </div>
          {selected === "ChatGPT" && (
            <Check className="h-4 w-4 text-white" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
