export function Footer() {
  return (
    <footer className="fixed bottom-2 left-0 right-0 border-t bg-background p-4">
      <div className="container flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>v1.0.0</span>
          <span>·</span>
          <span>© 2025 Releassimo</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/docs" className="hover:text-foreground">Docs</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Help</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Feedback</a>
        </div>
      </div>
    </footer>
  );
} 