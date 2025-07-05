"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, User, CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="fixed top-[56px] bottom-20 left-0 w-64 border-r bg-background p-4 z-40 overflow-y-auto">
      <nav className="space-y-2">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <Link href="/members">
          <Button variant="ghost" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            Members
          </Button>
        </Link>
        <Link href="/teams">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Teams
          </Button>
        </Link>
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
      </nav>
    </aside>
  );
} 