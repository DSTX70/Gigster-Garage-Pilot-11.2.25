import { AppHeader } from "@/components/app-header";
import { copy } from "@/lib/copy";
import { useTranslation } from "@/lib/i18n";
import { TaskForm } from "@/components/task-form";
import { TaskFilters } from "@/components/task-filters";
import { TaskList } from "@/components/task-list";
import { DesktopTaskViews } from "@/components/desktop-task-views";
import { ReminderSystem } from "@/components/reminder-system";
import { AssignmentFilter } from "@/components/assignment-filter";
import { FirstSuccessChecklist } from "@/components/FirstSuccessChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Folder, AlertTriangle, Clock, Calendar, FileText, CheckCircle2 } from "lucide-react";
import type { Project, Task, User, Proposal } from "@shared/schema";
import { format, isToday, isTomorrow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { DemoUpgradePrompt } from "@/components/DemoUpgradePrompt";
import { NewMenuButton } from "@/components/dashboard/NewMenuButton";
import { DashboardActionGrid } from "@/components/dashboard/DashboardActionGrid";
import { NextActionsCard } from "@/components/dashboard/NextActionsCard";
import { SetupBanner } from "@/components/SetupBanner";

export default function Home() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });

  // Calculate today's focus items
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tasksDueToday = tasks.filter(task => {
    if (task.completed) return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return isToday(dueDate);
  });

  const tasksDueTomorrow = tasks.filter(task => {
    if (task.completed) return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return isTomorrow(dueDate);
  });

  const pendingProposals = proposals.filter(p => p.status === 'draft' || p.status === 'pending');

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ id: taskId, updates });
  };

  // Calculate urgent and overview stats
  const now = new Date();
  const urgentTasks = tasks.filter(task => {
    if (task.completed) return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    return timeDiff <= 24 * 60 * 60 * 1000; // Due within 24 hours
  });

  const overdueTasks = tasks.filter(task => {
    if (task.completed) return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now;
  });

  const criticalTasks = tasks.filter(task => !task.completed && task.status === 'critical');
  const highStatusTasks = tasks.filter(task => !task.completed && task.status === 'high');
  const highPriorityTasks = tasks.filter(task => !task.completed && task.priority === 'high');
  
  // Filter active projects only (up to 4)
  const activeProjects = projects.filter(p => p.status === "active").slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <ReminderSystem />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        <SetupBanner />
        {/* 1. Page Title Row: Dashboard + subtitle + +New CTA */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="gg-h1 text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>
                {t("myDashboard")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{t("welcomeMessage")}</p>
            </div>
            <NewMenuButton onNewTask={() => setIsNewTaskOpen(true)} />
          </div>
        </div>

        {/* First Success Onboarding Checklist (new users only) */}
        {showOnboarding && !user?.hasCompletedOnboarding && (
          <div className="mb-4 sm:mb-6">
            <FirstSuccessChecklist onDismiss={() => setShowOnboarding(false)} />
          </div>
        )}

        {/* Today's Focus Panel */}
        {(tasksDueToday.length > 0 || pendingProposals.length > 0 || tasksDueTomorrow.length > 0) && (
          <Card className="mb-4 sm:mb-6 border-l-4 border-l-[#2EC5C2]" data-testid="card-today-focus">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#2EC5C2]" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tasks Due Today */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Due Today ({tasksDueToday.length})
                  </div>
                  {tasksDueToday.length > 0 ? (
                    <div className="space-y-1.5">
                      {tasksDueToday.slice(0, 3).map(task => (
                        <Link key={task.id} href="/tasks">
                          <div className="p-2 bg-amber-50 rounded border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors">
                            <div className="text-sm font-medium text-amber-900 truncate">{task.title}</div>
                            <div className="text-xs text-amber-700">
                              {task.priority && <Badge variant="outline" className="text-xs mr-1">{task.priority}</Badge>}
                            </div>
                          </div>
                        </Link>
                      ))}
                      {tasksDueToday.length > 3 && (
                        <Link href="/tasks?filter=due-today">
                          <span className="text-xs text-blue-600 hover:underline">+{tasksDueToday.length - 3} more</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No tasks due today</p>
                  )}
                </div>

                {/* Upcoming Tomorrow */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    Due Tomorrow ({tasksDueTomorrow.length})
                  </div>
                  {tasksDueTomorrow.length > 0 ? (
                    <div className="space-y-1.5">
                      {tasksDueTomorrow.slice(0, 3).map(task => (
                        <Link key={task.id} href="/tasks">
                          <div className="p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors">
                            <div className="text-sm font-medium text-blue-900 truncate">{task.title}</div>
                          </div>
                        </Link>
                      ))}
                      {tasksDueTomorrow.length > 3 && (
                        <Link href="/tasks">
                          <span className="text-xs text-blue-600 hover:underline">+{tasksDueTomorrow.length - 3} more</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nothing due tomorrow</p>
                  )}
                </div>

                {/* Pending Proposals */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="h-4 w-4" />
                    Proposals ({pendingProposals.length})
                  </div>
                  {pendingProposals.length > 0 ? (
                    <div className="space-y-1.5">
                      {pendingProposals.slice(0, 3).map(proposal => (
                        <Link key={proposal.id} href="/proposals">
                          <div className="p-2 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors">
                            <div className="text-sm font-medium text-purple-900 truncate">{proposal.title}</div>
                            <div className="text-xs text-purple-700 capitalize">{proposal.status}</div>
                          </div>
                        </Link>
                      ))}
                      {pendingProposals.length > 3 && (
                        <Link href="/proposals">
                          <span className="text-xs text-purple-600 hover:underline">+{pendingProposals.length - 3} more</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No pending proposals</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Today Strip - 3 compact KPI chips only */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Link href="/tasks?filter=overdue">
            <div 
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-sm ${
                overdueTasks.length > 0 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              data-testid="kpi-chip-overdue"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('overdue')}</span>
              <span className="font-bold">{overdueTasks.length}</span>
            </div>
          </Link>

          <Link href="/tasks?filter=due-soon">
            <div 
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-sm ${
                urgentTasks.length > 0 
                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              data-testid="kpi-chip-due-soon"
            >
              <Clock className="h-4 w-4" />
              <span>{t('dueSoon')}</span>
              <span className="font-bold">{urgentTasks.length}</span>
            </div>
          </Link>

          <Link href="/tasks?filter=high-priority">
            <div 
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-sm ${
                highPriorityTasks.length > 0 
                  ? 'bg-gray-200 text-gray-800 border border-gray-300' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              data-testid="kpi-chip-high-priority"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('highPriority')}</span>
              <span className="font-bold">{highPriorityTasks.length}</span>
            </div>
          </Link>
        </div>

        {/* 3. Next Actions Card */}
        <div className="mb-6 sm:mb-8">
          <NextActionsCard onNewTask={() => setIsNewTaskOpen(true)} />
        </div>

        {/* 4. Tasks Overview - Active filter default, overdue/due-soon first */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tasks</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <TaskFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              <AssignmentFilter selectedAssignee={selectedAssignee} onAssigneeChange={setSelectedAssignee} />
            </div>
          </div>
          
          {/* Desktop view */}
          <div className="hidden lg:block">
            <DesktopTaskViews 
              tasks={tasks
                .filter(task => {
                  const matchesFilter = 
                    activeFilter === 'all' || 
                    (activeFilter === 'active' && !task.completed) ||
                    (activeFilter === 'completed' && task.completed);
                  
                  const matchesAssignee = 
                    selectedAssignee === 'all' || 
                    task.assignedToId === selectedAssignee;
                    
                  return matchesFilter && matchesAssignee;
                })
                .sort((a, b) => {
                  // Sort overdue first, then due-soon, then by due date
                  const aOverdue = a.dueDate && new Date(a.dueDate) < now && !a.completed;
                  const bOverdue = b.dueDate && new Date(b.dueDate) < now && !b.completed;
                  if (aOverdue && !bOverdue) return -1;
                  if (!aOverdue && bOverdue) return 1;
                  
                  const aDueSoon = a.dueDate && new Date(a.dueDate).getTime() - now.getTime() <= 24 * 60 * 60 * 1000 && !a.completed;
                  const bDueSoon = b.dueDate && new Date(b.dueDate).getTime() - now.getTime() <= 24 * 60 * 60 * 1000 && !b.completed;
                  if (aDueSoon && !bDueSoon) return -1;
                  if (!aDueSoon && bDueSoon) return 1;
                  
                  return 0;
                })}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>

          {/* Mobile view */}
          <div className="block lg:hidden">
            <TaskList filter={activeFilter} assigneeFilter={selectedAssignee} />
          </div>
        </div>

        {/* 5. Projects - Active only, up to 4 + View all link */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Projects</h2>
            {projects.length > 4 && (
              <Link href="/project-dashboard">
                <span className="text-sm text-[#0B1D3A] hover:underline cursor-pointer">
                  View all projects
                </span>
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {activeProjects.map((project) => {
              const projectTasks = tasks.filter(task => task.projectId === project.id);
              const outstandingTasks = projectTasks.filter(task => !task.completed);
              const projectOverdue = outstandingTasks.filter(task => {
                if (!task.dueDate) return false;
                return new Date(task.dueDate) < now;
              });
              
              const completionPercentage = projectTasks.length > 0 
                ? Math.round(((projectTasks.length - outstandingTasks.length) / projectTasks.length) * 100)
                : 0;
                
              return (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer border group ${
                    projectOverdue.length > 0 ? "border-l-4 border-l-red-500 border-gray-200" : "border-gray-200"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-gray-500 group-hover:text-[#0B1D3A]" />
                          <span className="font-medium text-gray-900 group-hover:text-[#0B1D3A]">
                            {project.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {outstandingTasks.length} tasks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-[#2EC5C2] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 6. Quick Actions Grid (Create / Manage / Tools) */}
        <div className="mb-6">
          <DashboardActionGrid />
        </div>

        {/* New Task Modal */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {copy.tasks.createButton}
              </DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={() => setIsNewTaskOpen(false)} />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
