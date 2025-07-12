"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { ProjectSelector } from "./ProjectSelector";

export function Header() {
  const { user, signOut } = useAuth();

  const handleLoginSuccess = () => {
    // Refresh the page or update the UI as needed
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-red-50/95 backdrop-blur supports-[backdrop-filter]:bg-red-50/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center h-full pl-8">
          <Image 
            src="/logo.png" 
            alt="Releassimo Logo" 
            width={96}
            height={96}
            className="h-24 w-auto object-contain max-h-full"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <ProjectSelector />
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user.email}
              </Button>
              {/* <div className="flex flex-col items-end mr-2">
                <span className="text-xs text-gray-400">user_id: {user.id}</span>
                <span className="text-xs text-gray-400">sys_role: {userRole}</span>
                <span className="text-xs text-gray-400">member_id: {memberId}</span>
                <span className="text-xs text-gray-400">member_role: {memberRole}</span>
              </div> */}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <LoginDialog onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      </div>
    </header>
  );
} 