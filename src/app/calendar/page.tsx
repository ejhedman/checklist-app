"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
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

interface DragState {
  isDragging: boolean;
  releaseId: string | null;
  releaseName: string | null;
  originalDate: string | null;
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
      // Create date in local timezone by adding 'T00:00:00' to ensure local midnight
      const releaseDate = new Date(release.target_date + 'T00:00:00');
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

function CalendarGrid({ 
  year, 
  month, 
  title, 
  releases, 
  onReleaseMove,
  dragState,
  onDragStart,
  onDragEnd,
  addToast
}: { 
  year: number; 
  month: number; 
  title: string; 
  releases: Release[];
  onReleaseMove: (releaseId: string, newDate: string) => Promise<void>;
  dragState: DragState;
  onDragStart: (releaseId: string, releaseName: string, originalDate: string) => void;
  onDragEnd: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}) {
  const days = generateCalendarDays(year, month, releases);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDragStart = (e: React.DragEvent, release: Release) => {
    // Set drag data
    e.dataTransfer.setData('text/plain', release.id);
    e.dataTransfer.effectAllowed = 'move';
    
    e.stopPropagation();
    // Don't prevent default - this allows the drag to continue
    onDragStart(release.id, release.name, release.target_date);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const day = days.find(d => d.date.toDateString() === target.dataset.date);
    
    if (day) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (day.date >= today) {
        target.classList.add('bg-green-100', 'border-green-300', 'ring-2', 'ring-green-200');
      } else {
        target.classList.add('bg-red-100', 'border-red-300', 'ring-2', 'ring-red-200');
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-green-100', 'border-green-300', 'ring-2', 'ring-green-200');
    target.classList.remove('bg-red-100', 'border-red-300', 'ring-2', 'ring-red-200');
  };

  const handleDrop = async (e: React.DragEvent, day: CalendarDay) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-green-100', 'border-green-300', 'ring-2', 'ring-green-200');
    target.classList.remove('bg-red-100', 'border-red-300', 'ring-2', 'ring-red-200');
    
    if (!dragState.releaseId) {
      return;
    }

    // Check if the target date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (day.date < today) {
      addToast("Cannot move a release to a date in the past.", "error", 3000);
      onDragEnd();
      return;
    }

    // Format the new date as YYYY-MM-DD, handling timezone properly
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const date = String(day.date.getDate()).padStart(2, '0');
    const newDate = `${year}-${month}-${date}`;
    
    try {
      await onReleaseMove(dragState.releaseId, newDate);
    } catch (error) {
      console.error("Error moving release:", error);
      addToast("Failed to move release. Please try again.", "error", 3000);
    }
    
    onDragEnd();
  };

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
                data-date={day.date.toDateString()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}

              >
                <div className="font-medium mb-1">{day.dayOfMonth}</div>
                {day.releases.map((release) => (
                  <div
                    key={release.id}
                    className={`
                      w-full px-1 py-0.5 mb-0.5 rounded text-xs truncate cursor-grab active:cursor-grabbing
                      ${getStateColor(release.state)}
                      ${dragState.isDragging && dragState.releaseId === release.id ? 'opacity-50' : ''}
                    `}
                    title={`${release.name} - ${release.state} (Drag to move, click to view)`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, release)}
                    onClick={(e) => {
                      if (!dragState.isDragging) {
                        window.location.href = `/releases/${encodeURIComponent(release.name)}`;
                      }
                    }}
                  >
                    {release.name}
                  </div>
                ))}
              </div>
            );
            
            return <div key={index}>{dayContent}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalendarPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    releaseId: null,
    releaseName: null,
    originalDate: null
  });

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
      console.error("Error fetching releases:", error);
      // Set empty array on error to prevent infinite loading
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseMove = async (releaseId: string, newDate: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("releases")
        .update({ target_date: newDate })
        .eq("id", releaseId);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Update local state
      setReleases(prev => 
        prev.map(release => 
          release.id === releaseId 
            ? { ...release, target_date: newDate }
            : release
        )
      );
    } catch (error) {
      console.error("Error moving release:", error);
      // Re-throw error to be handled by the calling function
      throw error;
    }
  };

  const handleDragStart = (releaseId: string, releaseName: string, originalDate: string) => {
    setDragState({
      isDragging: true,
      releaseId,
      releaseName,
      originalDate
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      releaseId: null,
      releaseName: null,
      originalDate: null
    });
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Global drag end handler to reset drag state
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (dragState.isDragging) {
        handleDragEnd();
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [dragState.isDragging]);

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
        {dragState.isDragging && (
          <div className="text-sm text-muted-foreground">
            Dragging: {dragState.releaseName}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarGrid 
          year={currentYear} 
          month={currentMonth} 
          title={monthNames[currentMonth]}
          releases={releases}
          onReleaseMove={handleReleaseMove}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          addToast={addToast}
        />
        <CalendarGrid 
          year={nextYear} 
          month={nextMonth} 
          title={monthNames[nextMonth]}
          releases={releases}
          onReleaseMove={handleReleaseMove}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          addToast={addToast}
        />
      </div>
    </div>
  );
} 