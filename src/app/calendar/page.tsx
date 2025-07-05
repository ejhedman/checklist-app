"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Release {
  id: string;
  name: string;
  target_date: string;
  state: 'pending' | 'ready' | 'past_due' | 'complete' | 'cancelled';
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  releases: Release[];
}

function getStateColor(state: string) {
  switch (state) {
    case "past_due":
      return "bg-red-500 text-white";
    case "ready":
      return "bg-green-500 text-white";
    case "pending":
      return "bg-yellow-300 text-black";
    case "complete":
      return "bg-blue-500 text-white";
    case "cancelled":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-200 text-black";
  }
}

function generateCalendarDays(year: number, month: number, releases: Release[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday of the week

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = currentDate.getMonth() === month;
    const isPast = currentDate < today;
    
    // Find releases for this date
    const dayReleases = releases.filter(release => {
      const releaseDate = new Date(release.target_date);
      return releaseDate.getFullYear() === currentDate.getFullYear() &&
             releaseDate.getMonth() === currentDate.getMonth() &&
             releaseDate.getDate() === currentDate.getDate();
    });
    
    days.push({
      date: currentDate,
      dayOfMonth: currentDate.getDate(),
      isCurrentMonth,
      isPast,
      releases: dayReleases
    });
  }

  return days;
}

function CalendarGrid({ year, month, title, releases }: { year: number; month: number; title: string; releases: Release[] }) {
  const days = generateCalendarDays(year, month, releases);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            const dayContent = (
              <div
                className={`
                  p-1 text-center text-xs border rounded min-h-[60px] flex flex-col items-center justify-start
                  ${!day.isCurrentMonth ? 'text-muted-foreground/50' : ''}
                  ${day.isPast && day.releases.length === 0 ? 'bg-muted text-muted-foreground' : ''}
                  ${day.isCurrentMonth && !day.isPast && day.releases.length === 0 ? 'hover:bg-accent cursor-pointer' : ''}
                `}
              >
                <div className="font-medium mb-1">{day.dayOfMonth}</div>
                {day.releases.map((release) => (
                  <div
                    key={release.id}
                    className={`
                      w-full px-1 py-0.5 mb-0.5 rounded text-xs truncate
                      ${getStateColor(release.state)}
                    `}
                    title={`${release.name} - ${release.state}`}
                  >
                    {release.name}
                  </div>
                ))}
              </div>
            );
            return day.releases.length > 0 ? (
              <Link key={index} href={`/releases/${encodeURIComponent(day.releases[0].name)}`} className="w-full h-full block">
                {dayContent}
              </Link>
            ) : (
              <div key={index}>{dayContent}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalendarPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReleases = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("releases")
        .select("id, name, target_date, state")
        .order("target_date");

      if (error) {
        console.error("Error fetching releases:", error);
      } else {
        setReleases(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Release Calendar</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Release Calendar</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarGrid 
          year={currentYear} 
          month={currentMonth} 
          title={monthNames[currentMonth]}
          releases={releases}
        />
        <CalendarGrid 
          year={nextYear} 
          month={nextMonth} 
          title={monthNames[nextMonth]}
          releases={releases}
        />
      </div>
    </div>
  );
} 