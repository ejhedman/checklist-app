"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, User, CalendarDays, Pencil, Briefcase, Shield, Book, Target } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

export function Sidebar() {
  const { userRole, loading, selectedProject } = useAuth();
  const { isOpen, close } = useSidebar();
  const isAdmin = userRole === 'admin';
 
  // Don't render admin features until we're sure about the user's role
  if (loading) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={close}
          />
        )}
        <aside className={`fixed top-[56px] bottom-20 left-0 w-64 border-r bg-background p-4 z-50 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
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
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}
      <aside className={`fixed top-[56px] bottom-20 left-0 w-64 border-r bg-background p-4 z-50 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="space-y-2 h-full flex flex-col">
          <div className="flex-1 space-y-2">
            <Link href="/" onClick={close}>
              <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <div className="border-t border-border my-2"></div>
            <Link href="/releases" onClick={close}>
              <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                <Calendar className="h-4 w-4 mr-2" />
                Releases
              </Button>
            </Link>
            <Link href="/releasenotes" onClick={close}>
              <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                <Pencil className="h-4 w-4 mr-2" />
                Release Notes
              </Button>
            </Link>
            <Link href="/calendar" onClick={close}>
              <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <div className="border-t border-border my-2"></div>
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="border-t border-border my-2"></div>
            <Link href="/targets" onClick={close}>
              <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                <Target className="h-4 w-4 mr-2" />
                Targets
              </Button>
            </Link>          
            {selectedProject?.is_manage_members && (
              <>
                <Link href="/members" onClick={close}>
                  <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                    <User className="h-4 w-4 mr-2" />
                    Project Members
                  </Button>
                </Link>
                <Link href="/teams" onClick={close}>
                  <Button variant="ghost" className="w-full justify-start" disabled={!selectedProject}>
                    <Users className="h-4 w-4 mr-2" />
                    Project Teams
                  </Button>
                </Link>
              </>
            )}
            <Link href="/projects" onClick={close}>
              <Button variant="ghost" className="w-full justify-start">
                <Briefcase className="h-4 w-4 mr-2" />
                Projects
              </Button>
            </Link>          

            <div className="border-t border-border my-2"></div>
            <Link href="/docs" onClick={close}>
              <Button variant="ghost" className="w-full justify-start">
                <Book className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </Link>
            {isAdmin && (
              <>
                <div className="border-t border-border my-2"></div>

                <Link href="/users" onClick={close}>
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
    </>
  );
} 