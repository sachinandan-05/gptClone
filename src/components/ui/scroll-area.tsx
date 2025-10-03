// components/ui/scroll-area.tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithRef<typeof ScrollAreaPrimitive.Root> {
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = ({ className, children, ...props }: ScrollAreaProps) => {
  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative w-full h-full", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="w-full h-full overflow-x-hidden overflow-y-auto custom-scrollbar">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="w-1.5 bg-transparent hover:bg-white/5 transition-colors">
        <ScrollAreaPrimitive.Thumb className="bg-white/15 hover:bg-white/25 rounded-full transition-colors" />
      </ScrollAreaPrimitive.Scrollbar>
      {/* Hide horizontal scrollbar on mobile to prevent sideways scroll */}
      <ScrollAreaPrimitive.Scrollbar orientation="horizontal" className="h-0">
        <ScrollAreaPrimitive.Thumb className="hidden" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  )
}
