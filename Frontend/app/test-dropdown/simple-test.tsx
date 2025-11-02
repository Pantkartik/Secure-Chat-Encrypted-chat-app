"use client"

import { useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function SimpleDropdownTest() {
  const [clickLog, setClickLog] = useState<string[]>([])

  const handleClick = (item: string) => {
    setClickLog(prev => [...prev, `${item} clicked at ${new Date().toLocaleTimeString()}`])
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Simple Dropdown Test</h2>
      
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open Menu</Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleClick('Item 1')}>
            Item 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleClick('Item 2')}>
            Item 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleClick('Item 3')}>
            Item 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Click Log:</h3>
        {clickLog.length === 0 ? (
          <p className="text-gray-500">No clicks yet...</p>
        ) : (
          <ul className="space-y-1">
            {clickLog.map((log, index) => (
              <li key={index} className="text-sm">{log}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}