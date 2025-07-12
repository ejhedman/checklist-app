"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarRepository } from "@/lib/repository";
import { getStateColor, ReleaseState } from "@/lib/state-colors";

// Wrapper function to convert string to ReleaseState
function getStateColorWrapper(state: string) {
  return getStateColor(state as ReleaseState);
}

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper to calculate dynamic state based on today's date and database fields
function calculateDynamicState(
  release: {
    id: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  },
  allReleases: Array<{
    id: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  }> = []
): string {
  // If cancelled, state is "cancelled"
  if (release.is_cancelled) {
    return "cancelled";
  }
  
  // If deployed, state is "deployed"
  if (release.is_deployed) {
    return "deployed";
  }
  
  // Calculate days until target date
  const daysUntil = getDaysUntil(release.target_date);
  
  // If past due (before today's date)
  if (daysUntil < 0) {
    return "past_due";
  }
  
  // Find the next release on or after today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureReleases = allReleases
    .filter(r => !r.is_cancelled && !r.is_deployed)
    .filter(r => {
      const [year, month, day] = r.target_date.split('-').map(Number);
      const releaseDate = new Date(year, month - 1, day);
      releaseDate.setHours(0, 0, 0, 0);
      return releaseDate >= today;
    })
    .sort((a, b) => {
      const [yearA, monthA, dayA] = a.target_date.split('-').map(Number);
      const [yearB, monthB, dayB] = b.target_date.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });
  
  // If this is the next release (first in sorted list)
  if (futureReleases.length > 0 && futureReleases[0].id === release.id) {
    return "next";
  }
  
  // Otherwise, it's pending
  return "pending";
}

interface Release {
  id: string;
  name: string;
  target_date: string;
  is_archived?: boolean;
  is_cancelled?: boolean;
  is_deployed?: boolean;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  releases: Release[];
  hasUserInvolvement: boolean;
}

interface DragState {
  isDragging: boolean;
  releaseId: string | null;
  releaseName: string | null;
  originalDate: string | null;
}

function generateCalendarDays(year: number, month: number, releases: Release[], userInvolvedReleaseIds: Set<string>): CalendarDay[] {
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
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const currentDateString = `${year}-${month}-${day}`;
      return release.target_date === currentDateString;
    });
    
    // Check if any releases on this day have user involvement
    const hasUserInvolvement = dayReleases.some(release => userInvolvedReleaseIds.has(release.id));
    
    days.push({
      date: currentDate,
      dayOfMonth: currentDate.getDate(),
      isCurrentMonth,
      isPast,
      releases: dayReleases,
      hasUserInvolvement
    });
  }

  return days;
}

function CalendarGrid({ 
  year, 
  month, 
  title, 
  releases, 
  userInvolvedReleaseIds,
  onReleaseMove,
  dragState,
  onDragStart,
  onDragEnd,
  addToast,
  is_release_manager
}: { 
  year: number; 
  month: number; 
  title: string; 
  releases: Release[];
  userInvolvedReleaseIds: Set<string>;
  onReleaseMove: (releaseId: string, newDate: string) => Promise<void>;
  dragState: DragState;
  onDragStart: (releaseId: string, releaseName: string, originalDate: string) => void;
  onDragEnd: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  is_release_manager: boolean;
}) {
  const days = generateCalendarDays(year, month, releases, userInvolvedReleaseIds);
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
                  ${day.hasUserInvolvement ? 'bg-blue-50 border-blue-200' : ''}
                `}
                data-date={day.date.toDateString()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="text-[10px] text-muted-foreground mb-0.5">{
                  String(day.date.getMonth() + 1).padStart(2, '0') + '/' + String(day.date.getDate()).padStart(2, '0')
                }</div>
                {day.releases.map((release) => {
                  // Calculate dynamic state for this release
                  const dynamicState = calculateDynamicState(release, releases);
                  
                  return (
                    <div
                      key={release.id}
                      className={`
                        w-full px-1 py-0.5 mb-0.5 rounded text-xs truncate cursor-grab active:cursor-grabbing
                        ${getStateColorWrapper(dynamicState)}
                        ${dragState.isDragging && dragState.releaseId === release.id ? 'opacity-50' : ''}
                      `}
                      title={release.name}
                      draggable={is_release_manager}
                      onDragStart={(e) => handleDragStart(e, release)}
                      onClick={(e) => { // eslint-disable-line @typescript-eslint/no-unused-vars
                        if (!dragState.isDragging) {
                          window.location.href = `/releases/${encodeURIComponent(release.name)}`;
                        }
                      }}
                    >
                      {release.name}
                    </div>
                  );
                })}
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
  const { selectedProject, user, is_release_manager } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInvolvedReleaseIds, setUserInvolvedReleaseIds] = useState<Set<string>>(new Set());
  const { addToast } = useToast();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    releaseId: null,
    releaseName: null,
    originalDate: null
  });

  // Memoize the repository to prevent recreation on every render
  const calendarRepository = useMemo(() => new CalendarRepository(), []);

  const fetchUserInvolvement = useCallback(async () => {
    if (!user || !selectedProject) return;
    
    try {
      const involvement = await calendarRepository.getUserInvolvement(user.id, selectedProject.id);
      setUserInvolvedReleaseIds(involvement.involvedReleaseIds);
    } catch (error) {
      console.error("Error fetching user involvement:", error);
    }
  }, [user, selectedProject, calendarRepository]);

  const fetchReleases = useCallback(async () => {
    try {
      if (!selectedProject) {
        console.error("No project selected");
        setReleases([]);
        setLoading(false);
        return;
      }
      
      const calendarReleases = await calendarRepository.getReleases(selectedProject.id);
      // Convert CalendarRelease to Release format
      const releases: Release[] = calendarReleases.map(release => ({
        id: release.id,
        name: release.name,
        target_date: release.target_date,
        is_archived: release.is_archived,
        is_cancelled: release.is_cancelled,
        is_deployed: release.is_deployed,
      }));
      setReleases(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      // Set empty array on error to prevent infinite loading
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, calendarRepository]);

  const handleReleaseMove = async (releaseId: string, newDate: string) => {
    try {
      if (!selectedProject || !user) {
        console.error("No project selected or user not found");
        throw new Error("No project selected or user not found");
      }
      
      // Get the current release data to log the change
      const currentRelease = await calendarRepository.getReleaseById(releaseId);
      const oldDate = currentRelease.target_date;
      
      // Update the release date
      await calendarRepository.updateReleaseDate(releaseId, newDate);

      // Log activity: release date changed via calendar
      if (oldDate !== newDate) {
        // Fetch the member record for the current user
        if (!user.email) {
          console.error("No user email found");
          return;
        }
        const member = await calendarRepository.getMemberByEmail(user.email, selectedProject.id);

        await calendarRepository.logActivity({
          release_id: releaseId,
          member_id: member.id,
          project_id: selectedProject.id,
          activity_type: "release_date_changed",
          activity_details: { 
            oldDate: oldDate,
            newDate: newDate,
            releaseName: currentRelease.name,
            method: "calendar_drag_drop"
          },
        });
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
    fetchUserInvolvement();
  }, [fetchReleases, fetchUserInvolvement]);

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
          userInvolvedReleaseIds={userInvolvedReleaseIds}
          onReleaseMove={handleReleaseMove}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          addToast={addToast}
          is_release_manager={is_release_manager}
        />
        <CalendarGrid 
          year={nextYear} 
          month={nextMonth} 
          title={monthNames[nextMonth]}
          releases={releases}
          userInvolvedReleaseIds={userInvolvedReleaseIds}
          onReleaseMove={handleReleaseMove}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          addToast={addToast}
          is_release_manager={is_release_manager}
        />
      </div>
    </div>
  );
} 