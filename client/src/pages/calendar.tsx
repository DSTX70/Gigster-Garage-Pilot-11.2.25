import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { CalendarView } from "@/components/calendar-view";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import type { Task } from "@shared/schema";

export default function CalendarPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selected:", slotInfo);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-[var(--garage-navy)]" />
              <h1 className="text-2xl font-bold text-[var(--garage-navy)]">Calendar</h1>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--garage-navy)]"></div>
          </div>
        ) : (
          <CalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onSlotSelect={handleSlotSelect}
          />
        )}

        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onOpenChange={(open) => {
            setIsDetailModalOpen(open);
            if (!open) setSelectedTask(null);
          }}
        />
      </main>
    </div>
  );
}
