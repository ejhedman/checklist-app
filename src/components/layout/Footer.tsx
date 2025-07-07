export function Footer() {
  return (
    <footer className="fixed bottom-2 left-0 right-0 border-t bg-red-50/95 backdrop-blur supports-[backdrop-filter]:bg-red-50/60 p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground px-4">
        <div className="flex items-center">
          <span>v1.0.0</span>
        </div>
        <div className="flex items-center">
          <span>© 2025 Eric J Hedman</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-foreground">Feedback</a>
        </div>
      </div>
    </footer>
  );
} 