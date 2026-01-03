# Gigster Garage UI Code Export for ChatGPT Review

This file contains the key UI components, pages, and theme configuration for review.

---

## 1. Home Page (Dashboard) - `client/src/pages/home.tsx`

```tsx
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
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Folder, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { Project, Task, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { DemoUpgradePrompt } from "@/components/DemoUpgradePrompt";
import { NewMenuButton } from "@/components/dashboard/NewMenuButton";
import { DashboardActionGrid } from "@/components/dashboard/DashboardActionGrid";

export default function Home() {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

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
  
  const completedToday = tasks.filter(task => {
    if (!task.completed || !task.createdAt) return false;
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppHeader />
      <ReminderSystem />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        {/* Dashboard Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="gg-h1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
                {t("myDashboard")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{t("welcomeMessage")}</p>
            </div>

            <div className="flex items-center gap-2">
              <NewMenuButton onNewTask={() => setIsNewTaskOpen(true)} />
            </div>
          </div>
        </div>

        {/* Demo Mode Upgrade Prompt */}
        <div className="mb-6 sm:mb-8">
          <DemoUpgradePrompt context="general" compact={true} />
        </div>

        {/* First Success Onboarding Checklist */}
        {showOnboarding && !user?.hasCompletedOnboarding && (
          <div className="mb-6 sm:mb-8">
            <FirstSuccessChecklist onDismiss={() => setShowOnboarding(false)} />
          </div>
        )}

        {/* Urgent & Overview Section - 4 KPIs only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          {/* Overdue Tasks - thick red border (urgent) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/tasks?filter=overdue">
                <Card className="border-l-4 border-l-red-500 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" data-testid="kpi-overdue">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-red-600">{t('overdue')}</p>
                        <p className="text-2xl font-bold text-red-700">{overdueTasks.length}</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('overdueTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Due Soon - amber icon tint only (highlight) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/tasks?filter=due-soon">
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" data-testid="kpi-due-soon">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-600">{t('dueSoon')}</p>
                        <p className="text-2xl font-bold text-gray-900">{urgentTasks.length}</p>
                      </div>
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('dueSoonTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          {/* High Priority - subtle neutral card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/tasks?filter=high-priority">
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" data-testid="kpi-high-priority">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">{t('highPriority')}</p>
                        <p className="text-2xl font-bold text-gray-900">{highPriorityTasks.length}</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('highPriorityTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Completed Today - navy selected state */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/tasks?filter=completed-today">
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" data-testid="kpi-completed-today">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">{t('completedToday')}</p>
                        <p className="text-2xl font-bold text-[#0B1D3A]">{completedToday.length}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-[#2EC5C2]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('completedTodayTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Quick Actions (clean grouped grid) */}
        <div className="mb-8 lg:mb-12">
          <DashboardActionGrid />
        </div>

        {/* Project Folders Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Projects</h2>
            <Badge variant="secondary" className="text-xs sm:text-sm">{projects.length} active</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {projects.map((project) => {
              const projectTasks = tasks.filter(task => task.projectId === project.id);
              const outstandingTasks = projectTasks.filter(task => !task.completed);
              const criticalTasks = outstandingTasks.filter(task => task.priority === 'high');
              const projectOverdue = outstandingTasks.filter(task => {
                if (!task.dueDate) return false;
                return new Date(task.dueDate) < now;
              });
              
              const completionPercentage = projectTasks.length > 0 
                ? Math.round(((projectTasks.length - outstandingTasks.length) / projectTasks.length) * 100)
                : 0;
                
              return (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <Link href={`/project/${project.id}`}>
                      <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer border group ${
                        projectOverdue.length > 0 ? "border-l-4 border-l-red-500 border-gray-200" : "border-gray-200"
                      }`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <Folder className="h-5 w-5 mr-3 text-gray-500 group-hover:text-[#0B1D3A]" />
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-[#0B1D3A]">
                                  {project.name}
                                </CardTitle>
                                {project.description && (
                                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={
                              project.status === "active" ? "bg-[#0B1D3A] text-white" :
                              project.status === "completed" ? "bg-gray-100 text-gray-700 border border-gray-200" :
                              project.status === "on-hold" ? "bg-gray-100 text-gray-600 border border-gray-200" :
                              "bg-red-50 text-red-700 border border-red-200"
                            }>
                              {project.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* Outstanding Tasks */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Outstanding</span>
                              <span className="text-sm font-medium text-gray-900">{outstandingTasks.length}</span>
                            </div>
                            
                            {/* Critical Tasks */}
                            {criticalTasks.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">High Priority</span>
                                <span className="text-sm font-medium text-gray-900">{criticalTasks.length}</span>
                              </div>
                            )}
                            
                            {/* Overdue Tasks */}
                            {projectOverdue.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">Overdue</span>
                                <span className="text-sm font-medium text-red-700">{projectOverdue.length}</span>
                              </div>
                            )}
                            
                            {/* Progress Bar */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-gray-900">
                                  {completionPercentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#2EC5C2] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{project.name} - {completionPercentage}% Complete</p>
                      <p>Status: {project.status} • {outstandingTasks.length} tasks remaining</p>
                      {projectOverdue.length > 0 && (
                        <p className="text-red-600">{projectOverdue.length} overdue tasks</p>
                      )}
                      {criticalTasks.length > 0 && (
                        <p className="text-gray-600">{criticalTasks.length} high priority tasks</p>
                      )}
                      <p className="text-xs opacity-75">Click to view project dashboard</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* New Task Modal (triggered from + New menu) */}
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

        {/* Tasks Overview - Desktop optimized views */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tasks Overview</h2>
            <div className="flex items-center space-x-4">
              <TaskFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              <AssignmentFilter selectedAssignee={selectedAssignee} onAssigneeChange={setSelectedAssignee} />
            </div>
          </div>
          
          <DesktopTaskViews 
            tasks={tasks.filter(task => {
              const matchesFilter = 
                activeFilter === 'all' || 
                (activeFilter === 'active' && !task.completed) ||
                (activeFilter === 'completed' && task.completed);
              
              const matchesAssignee = 
                selectedAssignee === 'all' || 
                task.assignedToId === selectedAssignee;
                
              return matchesFilter && matchesAssignee;
            })}
          />
        </div>

        {/* Mobile task list */}
        <div className="block lg:hidden">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Tasks</h2>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <TaskFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              <AssignmentFilter selectedAssignee={selectedAssignee} onAssigneeChange={setSelectedAssignee} />
            </div>
          </div>
          <TaskList filter={activeFilter} assigneeFilter={selectedAssignee} />
        </div>
      </main>
    </div>
  );
}
```

---

## 2. Tasks Page - `client/src/pages/tasks.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, AlertTriangle, Clock, CheckCircle2, Target } from "lucide-react";
import { format, isAfter, startOfDay } from "date-fns";
import type { Task } from "@shared/schema";
import { copy } from "@/lib/copy";

export default function Tasks() {
  const [location, navigate] = useLocation();
  
  // Extract filter from URL params - more robust parsing
  const searchParams = new URLSearchParams(window.location.search);
  const filter = searchParams.get('filter') || 'all';
  
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter tasks based on the filter parameter
  const getFilteredTasks = () => {
    const now = new Date();
    
    switch (filter) {
      case 'overdue':
        return tasks.filter(task => {
          if (task.completed || !task.dueDate) return false;
          return new Date(task.dueDate) < now;
        });
      
      case 'due-soon':
        return tasks.filter(task => {
          if (task.completed || !task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          const isToday = startOfDay(dueDate).getTime() === startOfDay(now).getTime();
          const isTomorrow = timeDiff <= 24 * 60 * 60 * 1000 && timeDiff > 0;
          return isToday || isTomorrow;
        });
      
      case 'high-priority':
        return tasks.filter(task => !task.completed && task.priority === 'high');
      
      case 'completed-today':
        return tasks.filter(task => {
          if (!task.completed) return false;
          // Use createdAt since updatedAt may not exist in schema
          const completedDate = task.createdAt ? new Date(task.createdAt) : new Date();
          return startOfDay(completedDate).getTime() === startOfDay(now).getTime();
        });
      
      case 'all':
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const getFilterInfo = () => {
    switch (filter) {
      case 'overdue':
        return {
          title: copy.dashboard.overdue.title,
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          description: copy.dashboard.overdue.sub,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'due-soon':
        return {
          title: copy.dashboard.dueSoon.title,
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          description: copy.dashboard.dueSoon.sub,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'high-priority':
        return {
          title: copy.dashboard.highPriority.title,
          icon: <Target className="h-6 w-6 text-orange-600" />,
          description: copy.dashboard.highPriority.sub,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'completed-today':
        return {
          title: copy.dashboard.completed.title,
          icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
          description: copy.dashboard.completed.sub,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          title: copy.tasks.title,
          icon: <Calendar className="h-6 w-6 text-blue-600" />,
          description: copy.dashboard.greeting,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const filterInfo = getFilterInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
{copy.tasks.backButton}
          </Button>
          
          <Card className={`${filterInfo.bgColor} ${filterInfo.borderColor} border-2`}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                {filterInfo.icon}
                <div>
                  <CardTitle className={`text-2xl ${filterInfo.color}`}>
                    {filterInfo.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{filterInfo.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </Badge>
                {filteredTasks.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                {filterInfo.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {copy.tasks.empty.title}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'completed-today' 
                  ? copy.dashboard.completed.sub
                  : filter === 'overdue'
                  ? copy.dashboard.overdue.sub
                  : filter === 'due-soon'
                  ? copy.dashboard.dueSoon.sub
                  : filter === 'high-priority'
                  ? copy.dashboard.highPriority.sub
                  : copy.tasks.empty.sub
                }
              </p>
              <Button onClick={() => navigate("/")}>
                {filter === 'all' ? copy.tasks.empty.cta : copy.tasks.backButton}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## 3. Navigation Menu - `client/src/components/navigation-menu.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  ChevronRight,
  ChevronDown,
  Home,
  Calendar,
  Users,
  Building,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Bot,
  Brain,
  Clock,
  Webhook,
  Key,
  Database,
  Plus,
  Search,
  Archive,
  MessageSquare,
  FileCheck,
  Presentation,
  PenTool,
  Timer,
  Briefcase,
  TrendingUp,
  Eye,
  Mail,
  HelpCircle,
  Keyboard,
} from 'lucide-react';

interface NavigationSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavigationItem[];
  adminOnly?: boolean;
  collapsed?: boolean;
}

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
  badge?: string;
}

const navigationSections: NavigationSection[] = [
  {
    id: 'core',
    title: 'Core Features',
    icon: Home,
    items: [
      { id: 'home', title: 'Dashboard', icon: Home, path: '/' },
      { id: 'tasks', title: 'Tasks', icon: FileCheck, path: '/tasks' },
      { id: 'projects', title: 'Projects', icon: Briefcase, path: '/project-dashboard' },
      { id: 'calendar', title: 'Calendar', icon: Calendar, path: '/calendar' },
      { id: 'messages', title: 'Messages', icon: MessageSquare, path: '/messages' },
    ],
  },
  {
    id: 'business',
    title: 'Business Operations',
    icon: Building,
    items: [
      { id: 'clients', title: 'Clients', icon: Users, path: '/client-list' },
      { id: 'invoices', title: 'Invoices', icon: FileText, path: '/invoices' },
      { id: 'contracts', title: 'Contracts', icon: FileCheck, path: '/contracts' },
      { id: 'payments', title: 'Payments', icon: Building, path: '/payments' },
      { id: 'proposals', title: 'Proposals', icon: Presentation, path: '/proposals' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: BarChart3,
    items: [
      { id: 'analytics', title: 'Analytics', icon: BarChart3, path: '/analytics' },
      { id: 'productivity', title: 'Productivity', icon: TrendingUp, path: '/productivity' },
      { id: 'advanced-reporting', title: 'Advanced Reports', icon: Eye, path: '/advanced-reporting' },
      { id: 'ai-insights', title: 'AI Insights', icon: Brain, path: '/ai-insights' },
      { id: 'predictive-analytics', title: 'Predictive Analytics', icon: Brain, path: '/predictive-analytics' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    icon: Zap,
    collapsed: true,
    items: [
      { id: 'workflow-automation', title: 'Workflow Automation', icon: Zap, path: '/workflow-automation' },
      { id: 'smart-scheduling', title: 'Smart Scheduling', icon: Clock, path: '/smart-scheduling' },
      { id: 'garage-assistant', title: 'AI Assistant', icon: Bot, path: '/garage-assistant' },
      { id: 'team-collaboration', title: 'Team Collaboration', icon: Users, path: '/team-collaboration' },
      { id: 'custom-fields', title: 'Custom Fields', icon: Settings, path: '/custom-fields' },
      { id: 'bulk-operations', title: 'Bulk Operations', icon: Database, path: '/bulk-operations' },
      { id: 'templates', title: 'Templates', icon: FileText, path: '/templates' },
      { id: 'filing-cabinet', title: 'Filing Cabinet', icon: Archive, path: '/filing-cabinet' },
    ],
  },
  {
    id: 'system',
    title: 'System Administration',
    icon: Shield,
    adminOnly: true,
    collapsed: true,
    items: [
      { id: 'admin-panel', title: 'Admin Panel', icon: Shield, path: '/admin', adminOnly: true, badge: 'Admin' },
      { id: 'agent-management', title: 'Agent Management', icon: Bot, path: '/agent-management', adminOnly: true },
      { id: 'permissions', title: 'Permissions', icon: Key, path: '/permissions-management', adminOnly: true },
      { id: 'sso', title: 'SSO Management', icon: Shield, path: '/sso-management', adminOnly: true },
      { id: 'audit', title: 'Audit Logs', icon: Eye, path: '/audit-logging', adminOnly: true },
      { id: 'api-webhooks', title: 'API & Webhooks', icon: Webhook, path: '/api-webhooks', adminOnly: true },
      { id: 'performance', title: 'Performance', icon: TrendingUp, path: '/performance-dashboard', adminOnly: true },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Utilities',
    icon: PenTool,
    collapsed: true,
    items: [
      { id: 'instant-proposal', title: 'Instant Proposal', icon: Zap, path: '/instant-proposal' },
      { id: 'create-presentation', title: 'Create Presentation', icon: Presentation, path: '/create-presentation' },
      { id: 'template-editor', title: 'Template Editor', icon: PenTool, path: '/template-editor' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    icon: HelpCircle,
    collapsed: true,
    items: [
      { id: 'user-manual', title: 'User Manual', icon: FileText, path: '/user-manual' },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', icon: Keyboard, path: '/keyboard-shortcuts' },
    ],
  },
];

export function NavigationMenu() {
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['core', 'business']) // Core and Business sections start expanded
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const visibleSections = navigationSections.filter(section => 
    !section.adminOnly || isAdmin
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 relative p-1.5 sm:p-2"
          data-testid="button-navigation-menu"
          title="Navigation Menu"
        >
          <Menu size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-[600px] overflow-y-auto"
        align="end"
        side="bottom"
      >
        <DropdownMenuLabel className="text-lg font-semibold text-garage-navy">
          Navigation
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="space-y-1">
          {visibleSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const visibleItems = section.items.filter(item => 
              !item.adminOnly || isAdmin
            );

            if (visibleItems.length === 0) return null;

            const SectionIcon = section.icon;

            return (
              <Collapsible
                key={section.id}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 py-2 h-auto text-left hover:bg-gray-50"
                    data-testid={`section-${section.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <SectionIcon size={18} className="text-garage-navy" />
                      <span className="font-medium text-gray-900">
                        {section.title}
                      </span>
                      {section.adminOnly && (
                        <span className="bg-garage-navy text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 pl-4">
                  {visibleItems.map((item) => {
                    const ItemIcon = item.icon;
                    
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-50"
                        onClick={() => handleItemClick(item.path)}
                        data-testid={`nav-item-${item.id}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <ItemIcon size={16} className="text-garage-navy/70" />
                          <span className="text-gray-700 font-medium">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="bg-ignition-teal text-white px-1.5 py-0.5 rounded-full text-xs font-medium ml-auto">
                              {item.badge}
                            </span>
                          )}
                          {item.adminOnly && (
                            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium ml-auto">
                              Admin
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Quick Actions */}
        <div className="p-2">
          <DropdownMenuLabel className="text-sm font-medium text-gray-600 mb-2">
            Quick Actions
          </DropdownMenuLabel>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => handleItemClick('/tasks?new=true')}
              data-testid="quick-new-task"
            >
              <Plus size={14} className="mr-1" />
              New Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => handleItemClick('/create-invoice')}
              data-testid="quick-new-invoice"
            >
              <FileText size={14} className="mr-1" />
              New Invoice
            </Button>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Search Hint */}
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Need help finding something?
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-garage-navy hover:bg-garage-navy/10"
            onClick={() => {
              // Focus global search (implement based on your search component)
              const searchInput = document.querySelector('[data-testid="global-search-input"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
            data-testid="focus-search"
          >
            <Search size={14} className="mr-1" />
            Use Global Search
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavigationMenu;
```

---

## 4. CSS Theme - `client/src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Enhanced Brand System - Style Refresh */
  --brand:#0B1D3A; /* Navy */
  --accent:#2EC5C2; /* Mint */
  --signal:#FFB52E; /* Amber */

  /* Neutrals (light) */
  --bg:#F7F8FA;
  --panel:#FFFFFF;
  --surface:#F3F4F6;
  --text:#1A2433;
  --muted:#6B7280;
  --keyline:rgba(11,29,58,0.10);

  /* States */
  --success:#1e845e;
  --warn:#d58b19;
  --danger:#c43b3b;
  --info:#2e7ea8;

  /* Elevation */
  --radius:14px;
  --shadow-1:0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(11,29,58,.06);

  /* Legacy Gigster Garage Brand Colors - Preserved for compatibility */
  --gg-teal: #008272;
  --gg-amber: #FFB200;
  --gg-teal-tint: #66E0C7;
  --gg-blue-tint: #66C7FF;
  --gg-amber-tint: #FFD87A;
  --gg-slate-ink: #1A241A;
  --gg-light-card: #F7F9FA;
  --gg-white: #FFFFFF;

  /* Brand gradients */
  --grad: linear-gradient(90deg, var(--accent) 0%, var(--signal) 100%);
  --grad-soft: linear-gradient(90deg, #E7F7F3 0%, #FFF3DB 100%);
  --subtext: var(--muted);
  --placeholder: #9CA3AF;
  
  /* Legacy mappings for backward compatibility */
  --slate-ink: var(--gg-slate-ink);
  --light-card: var(--gg-light-card);
  --brand-teal: var(--gg-teal);
  --brand-teal-tint: var(--gg-teal-tint);
  --brand-blue-tint: var(--gg-blue-tint);
  --brand-amber: var(--gg-amber);
  --brand-amber-tint: var(--gg-amber-tint);
  
  /* Legacy colors for backward compatibility */
  --garage-navy: #004C6D;
  --ignition-teal: #0B1D3A;  
  --workshop-amber: #FFB200;
  --steel-gray: hsl(0 0% 24%); /* #3C3C3C */
  --concrete-light: hsl(0 0% 90%); /* #E5E5E5 */
  --gigster-white: hsl(0 0% 100%); /* #FFFFFF */
  --cream-card: #F9F5F1;
  
  /* Theme Variables */
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 0%);
  --card: hsl(248 10% 97%);
  --card-foreground: hsl(0 0% 0%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(0 0% 0%);
  --primary: #004C6D; /* Garage Navy */
  --primary-foreground: #ffffff;
  --secondary: #0B1D3A; /* Garage Navy */
  --secondary-foreground: #ffffff;
  --muted: hsl(220 14.3% 95.9%);
  --muted-foreground: hsl(220 8.9% 46.1%);
  --accent: #FFB000; /* Workshop Amber for accents */
  --accent-foreground: #004C6D;
  --destructive: hsl(0 84% 60%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(220 13% 91%);
  --input: hsl(220 13% 91%);
  --ring: #004C6D; /* Garage Navy */
  --radius: 0.75rem;
  
  /* Neutral colors matching design */
  --neutral-50: hsl(210 17% 98%);
  --neutral-100: hsl(214 15% 95%);
  --neutral-200: hsl(210 16% 93%);
  --neutral-300: hsl(213 13% 84%);
  --neutral-400: hsl(215 12% 64%);
  --neutral-500: hsl(214 11% 45%);
  --neutral-600: hsl(215 19% 35%);
  --neutral-700: hsl(215 25% 27%);
  --neutral-800: hsl(217 33% 17%);
  --neutral-900: hsl(222 47% 11%);

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;

  /* === Spacing Tokens (Tier 4 Visual Polish) === */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  /* === Typography Scale (Tier 4 Visual Polish) === */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;

  /* Card and Component Tokens */
  --card-padding: var(--space-6);
  --card-gap: var(--space-4);
  --section-gap: var(--space-8);
  --page-padding: var(--space-6);
  --page-padding-mobile: var(--space-4);

  /* Button Heights */
  --button-height-sm: 2rem;   /* 32px */
  --button-height-md: 2.5rem; /* 40px */
  --button-height-lg: 3rem;   /* 48px */

  /* Gigster Garage Brand Gradients */
  --gigster-gradient-teal-amber: var(--grad);
  --gigster-gradient-soft: var(--grad-soft);
  --gigster-gradient: var(--grad);
  --gigster-gradient-navy: linear-gradient(135deg, #004C6D 0%, #003d5a 100%);
  --gigster-gradient-teal: linear-gradient(135deg, #008272 0%, #006b5e 100%);
  --gigster-gradient-amber: linear-gradient(135deg, #FFB200 0%, #CC8A00 100%);
  --gigster-shadow-navy: 0 4px 12px rgba(0, 76, 109, 0.15);
  --gigster-shadow-teal: 0 4px 12px rgba(11, 29, 58, 0.15);
  --gigster-shadow-amber: 0 4px 12px rgba(255, 176, 0, 0.15);
}

/* Enhanced Dark theme from style refresh */
.dark, .theme-dark {
  --bg:#151A22;
  --panel:#1B2330;
  --surface:#161C27;
  --text:#ECF2F8;
  --muted:#B4BECA;
  --keyline:rgba(255,255,255,.10);
  --shadow-1:0 1px 2px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.28);
  
  /* Legacy dark theme compatibility */
  --background: hsl(222 47% 11%);
  --foreground: hsl(210 17% 98%);
  --card: hsl(222 41% 13%);
  --card-foreground: hsl(210 17% 98%);
  --popover: hsl(222 47% 11%);
  --popover-foreground: hsl(210 17% 98%);
  --primary: hsl(211 100% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(211 100% 50%);
  --secondary-foreground: hsl(0 0% 100%);
  --muted-dark: hsl(217 33% 17%);
  --muted-foreground: hsl(215 12% 64%);
  --accent-hsl: hsl(38 92% 50%);
  --accent-foreground: hsl(222 47% 11%);
  --destructive: hsl(0 84% 60%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(217 33% 17%);
  --input: hsl(217 33% 17%);
  --ring: hsl(217 78% 58%);
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply text-foreground font-sans antialiased;
    font-family: 'Open Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    color: var(--text);
    background:
      radial-gradient(1200px 600px at 8% -10%, rgba(46,197,194,.10), transparent 55%),
      radial-gradient(900px 420px at 110% -20%, rgba(255,181,46,.10), transparent 60%),
      var(--bg);
    line-height: 1.5;
    transition: background .2s ease, color .2s ease;
  }
  
  /* Enhanced Typography System - Style Refresh */
  h1, .gg-h1 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 22px;
    line-height: 1.3;
    margin: 6px 0 2px;
    color: var(--text);
  }
  
  h2, .gg-h2 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 1.5rem; /* 24px */
    line-height: 1.3;
    color: var(--text);
  }
  
  .gg-body {
    font-family: 'Open Sans', system-ui, sans-serif;
    font-weight: 400;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text);
  }
  
  .gg-subtext, .subheader {
    font-family: 'Open Sans', system-ui, sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.6;
    color: var(--muted);
  }
  
  .gg-placeholder {
    font-family: 'Open Sans', system-ui, sans-serif;
    font-weight: 400;
    font-size: 0.875rem;
    color: var(--placeholder);
  }
  
  /* Enhanced button styling from refresh */
  .btn {
    appearance: none;
    border: 0;
    cursor: pointer;
    font: 600 13px/1 'Open Sans', system-ui, sans-serif;
    height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: background .15s ease, border-color .15s ease, color .15s ease, opacity .15s ease;
  }
  
  .btn-primary-refresh {
    background: linear-gradient(180deg, var(--brand), #09172f);
    color: #fff;
  }
  
  .btn-primary-refresh:hover {
    background: #09172f;
  }
}

/* ... Additional component styles truncated for brevity ... */
```

---

## 5. Tailwind Config - `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // New Gigster Garage Brand Colors
        slateInk: '#1A241A',
        lightCard: '#F7F9FA', 
        brand: {
          teal: '#008272',
          tealTint: '#66E0C7',
          blueTint: '#66C7FF',
          amber: '#FFB200',
          amberTint: '#FFD87A'
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
        },
      },
      boxShadow: {
        card: '0 6px 22px rgba(0,0,0,0.06)',
        'gigster-glow': '0 8px 26px rgba(0,130,114,.22), inset 0 0 0 1px rgba(255,178,0,.45)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

---

## Brand Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| **Navy (Brand)** | `#0B1D3A` | Primary brand, selected states, headings |
| **Mint (Accent)** | `#2EC5C2` | Progress bars, completed states, success |
| **Amber (Signal)** | `#FFB52E` | Due soon warnings, highlights |
| **Garage Navy** | `#004C6D` | Legacy primary, headers |
| **Teal** | `#008272` | Legacy accent |
| **Red** | `#c43b3b` | Danger, overdue items |
| **Success** | `#1e845e` | Success states |

## Design System Notes

1. **Card Emphasis**: Only Overdue items use thick 4px left borders (red); all other cards use subtle 1px gray borders
2. **Typography**: Montserrat for headings (h1, h2), Open Sans for body text
3. **Spacing**: Uses CSS custom properties for consistent spacing (--space-1 through --space-16)
4. **Dark Mode**: Supported via `.dark` class with inverted color scheme
5. **Shadows**: Subtle shadows using --shadow-1 for elevation

---

*Generated for ChatGPT UI cleanup review - January 2026*
