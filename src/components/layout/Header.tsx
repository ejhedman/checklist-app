"use client";

import { Button } from "@/components/ui/button";
import { LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { ProjectSelector } from "./ProjectSelector";
import { Logo } from "@/components/ui/logo";

export function Header() {
  const { user, signOut } = useAuth();
  const { isOpen, toggle } = useSidebar();

  const handleLoginSuccess = () => {
    // Refresh the page or update the UI as needed
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-red-50/95 backdrop-blur supports-[backdrop-filter]:bg-red-50/60">
      <div className="relative flex h-14 items-center px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center h-full flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={toggle}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Logo size="md" priority responsive />
        </div>

        {/* Center: Email and ProjectSelector (stacked on mobile) */}
        {user ? (
          <div className="flex flex-col items-start justify-center flex-1 min-w-0 px-2 sm:flex-row sm:items-center sm:justify-end sm:space-x-4">
            <Button variant="ghost" size="sm" className="justify-start w-full sm:w-auto truncate">
              <User className="h-4 w-4 mr-2 hidden sm:inline" />
              <span className="truncate">{user.email}</span>
            </Button>
            <div className="w-full sm:w-auto mt-1 sm:mt-0">
              <ProjectSelector />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-end">
            <LoginDialog onLoginSuccess={handleLoginSuccess} />
          </div>
        )}

        {/* Logoff icon: always at top right, vertically centered */}
        {user && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="p-2"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
} 