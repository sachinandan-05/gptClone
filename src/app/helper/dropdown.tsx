"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/ui/dropdown-menu"

interface DropdownMenuCheckboxesProps {
  selected: string;
  setSelected: (value: string) => void;
}

export function DropdownMenuCheckboxes({ selected, setSelected }: DropdownMenuCheckboxesProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {selected} <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        {/* ChatGPT Go */}
        <DropdownMenuItem
          onClick={() => setSelected("ChatGPT Go")}
          className="flex justify-between items-center"
        >
          <div className="flex flex-col">
            <span className="font-medium">ChatGPT</span>
            <span className="text-xs text-muted-foreground">
              Our smartest model & more
            </span>
          </div>
          <Button size="sm" variant="outline" className="ml-2">
            Upgrade
          </Button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* ChatGPT */}
        <DropdownMenuItem
          onClick={() => setSelected("ChatGPT")}
          className="flex justify-between items-center"
        >
          <div className="flex flex-col">
            <span className="font-medium">ChatGPT</span>
            <span className="text-xs text-muted-foreground">
              Great for everyday tasks
            </span>
          </div>
          {selected === "ChatGPT" && (
            <Check className="h-4 w-4 ml-2 text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
