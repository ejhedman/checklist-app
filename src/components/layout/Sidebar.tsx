"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, User, CalendarDays, Pencil, Building2, Shield, Building } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const { userRole, user, loading } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Debug logging
  // console.log('Sidebar - loading:', loading);
  // console.log('Sidebar - userRole:', userRole);
  // console.log('Sidebar - isAdmin:', isAdmin);
  // console.log('Sidebar - current user ID:', user?.id);
  // console.log('Sidebar - current user email:', user?.email);

  // Don't render admin features until we're sure about the user's role
  if (loading) {
    return (
      <aside className="fixed top-[56px] bottom-20 left-0 w-64 border-r bg-background p-4 z-40 overflow-y-auto">
        <nav className="space-y-2 h-full flex flex-col">
          <div className="flex-1 space-y-2">
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded mb-2"></div>
              <div className="h-10 bg-muted rounded mb-2"></div>
              <div className="h-10 bg-muted rounded mb-2"></div>
            </div>
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed top-[56px] bottom-20 left-0 w-64 border-r bg-background p-4 z-40 overflow-y-auto">
      <nav className="space-y-2 h-full flex flex-col">
        <div className="flex-1 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="border-t border-border my-2"></div>
          <Link href="/releases">
            <Button variant="ghost" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Releases
            </Button>
          </Link>
          <Link href="/releasenotes">
            <Button variant="ghost" className="w-full justify-start">
              <Pencil className="h-4 w-4 mr-2" />
              Release Notes
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="ghost" className="w-full justify-start">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </Link>
          <div className="border-t border-border my-2"></div>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="border-t border-border my-2"></div>
          <Link href="/members">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Project Members
            </Button>
          </Link>
          <Link href="/teams">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              ProjectTeams
            </Button>
          </Link>
          <Link href="/targets">
            <Button variant="ghost" className="w-full justify-start">
              <Building2 className="h-4 w-4 mr-2" />
              Targets
            </Button>
          </Link>
          {isAdmin && (
            <>
              <div className="border-t border-border my-2"></div>
              <Link href="/tenants">
                <Button variant="ghost" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Projects
                </Button>
              </Link>
              <Link href="/users">
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
} 