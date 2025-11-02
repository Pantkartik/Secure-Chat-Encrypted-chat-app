import { UserMenu } from '@/components/user-menu'
import { SimpleDropdownTest } from './simple-test'
import { ErrorBoundary } from './error-boundary'

export default function TestDropdownPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dropdown Menu Test</h1>
        
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Menu Dropdown</h2>
          <p className="text-muted-foreground mb-4">
            Click the user icon to open the dropdown. The dropdown should now overlay without affecting the layout.
          </p>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">User Menu:</span>
            <UserMenu />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Feature 1</h3>
            <p className="text-sm text-muted-foreground">This content should not shift when dropdown opens.</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Feature 2</h3>
            <p className="text-sm text-muted-foreground">The dropdown should overlay above other elements.</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Feature 3</h3>
            <p className="text-sm text-muted-foreground">Layout remains stable when dropdown is active.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Simple Test</h2>
        <p className="text-muted-foreground mb-4">
          This is a simplified test to isolate any click issues.
        </p>
        <SimpleDropdownTest />
      </div>
    </div>
  )
}