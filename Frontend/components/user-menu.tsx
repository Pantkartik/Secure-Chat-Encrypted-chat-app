"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Settings, LogOut, User, Shield, Bell, Palette } from "lucide-react"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const router = useRouter()

  const handleLogout = () => {
    console.log('Logout clicked');
    // Clear any stored user data
    localStorage.removeItem('user');
    localStorage.removeItem('userSettings');
    sessionStorage.clear();
    
    // Redirect to home page
    router.push('/');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    router.push('/settings');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        side="bottom" 
        sideOffset={4}
        className="w-56 bg-background border border-border rounded-lg shadow-lg"
      >
        <div className="px-2 py-1.5 text-sm font-semibold">
          Account
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push('/settings/security')}>
          <Shield className="mr-2 h-4 w-4" />
          Security
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push('/settings/notifications')}>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push('/settings/appearance')}>
          <Palette className="mr-2 h-4 w-4" />
          Appearance
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}