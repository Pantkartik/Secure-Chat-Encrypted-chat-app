"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({ isOpen: false, setIsOpen: () => {} })

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, ref])
  
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        {...props}
      />
    </DropdownMenuContext.Provider>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer pointer-events-auto",
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('DropdownMenuTrigger clicked, toggling menu')
        setIsOpen(!isOpen)
        onClick?.(e)
      }}
      onMouseDown={(e) => {
        e.stopPropagation() // Prevent mousedown from bubbling
      }}
      {...props}
    />
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center"
    side?: "top" | "right" | "bottom" | "left"
    sideOffset?: number
  }
>(({ className, align = "end", side = "bottom", sideOffset = 4, ...props }, ref) => {
  const { isOpen } = React.useContext(DropdownMenuContext)
  
  if (!isOpen) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        side === "bottom" && "top-full mt-1",
        side === "top" && "bottom-full mb-1",
        side === "right" && "left-full ml-1",
        side === "left" && "right-full mr-1",
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 transform -translate-x-1/2",
        "max-h-[300px] overflow-y-auto",
        className
      )}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
      style={{ 
        position: 'absolute',
        isolation: 'isolate' // Create new stacking context
      }}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
    onClick?: () => void
  }
>(({ className, inset, onClick, ...props }, ref) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('DropdownMenuItem clicked, closing menu')
    onClick?.()
    setIsOpen(false) // Close dropdown when item is clicked
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        "pointer-events-auto", // Ensure clicks are processed
        className
      )}
      onClick={handleClick}
      onMouseDown={(e) => {
        e.stopPropagation() // Prevent mousedown from bubbling
      }}
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    role="separator"
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}