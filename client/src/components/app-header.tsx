import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  CheckCheck, LogOut, Settings, User, Users, Plus, Mail, Shield, Home, Database, Zap, Bot, 
  Clock, Brain, BarChart3, Webhook, Key, FileText, Globe, HelpCircle, Keyboard, BookOpen,
  ChevronDown, Briefcase, Calendar, MessageSquare, Building, Presentation, FileCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationMenu } from "./navigation-menu";
import { Link } from "wouter";
import { GigsterLogo } from "./vsuite-logo";
import { ReminderModal } from "@/components/reminder-modal";
import { GlobalSearch } from "@/components/global-search";
import { MoodPaletteSwitcher } from "@/components/MoodPaletteSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DemoModeIndicator } from "@/components/DemoModeBanner";
import { openKeyboardShortcuts } from "@/components/KeyboardShortcutsGuide";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Task, TimeLog } from "@shared/schema";
import { startOfDay, addDays } from "date-fns";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

const coreFeatures = [
  { id: 'home', title: 'Dashboard', icon: Home, path: '/' },
  { id: 'tasks', title: 'Tasks', icon: FileCheck, path: '/tasks' },
  { id: 'projects', title: 'Projects', icon: Briefcase, path: '/project-dashboard' },
  { id: 'calendar', title: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'messages', title: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'coach', title: 'Coach', icon: Brain, path: '/gigster-coach' },
];

const businessOperations = [
  { id: 'clients', title: 'Clients', icon: Users, path: '/client-list' },
  { id: 'invoices', title: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'contracts', title: 'Contracts', icon: FileCheck, path: '/contracts' },
  { id: 'payments', title: 'Payments', icon: Building, path: '/payments' },
  { id: 'proposals', title: 'Proposals', icon: Presentation, path: '/proposals' },
];

const helpItems = [
  { id: 'user-manual', title: 'User Manual', icon: BookOpen, path: '/user-manual' },
  { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', icon: Keyboard, path: null, action: 'keyboard' },
];

export function AppHeader() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(0);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch active timer
  const { data: activeTimer } = useQuery<TimeLog | null>({
    queryKey: ["/api/timelogs/active"],
    refetchInterval: (data) => (data && (data as any).isActive ? 5000 : 30000),
    staleTime: 1000 * 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Update current time for active timer
  useEffect(() => {
    if (activeTimer && activeTimer.isActive) {
      const interval = setInterval(() => {
        const now = Date.now();
        const startTime = new Date(activeTimer.startTime).getTime();
        setCurrentTime(Math.floor((now - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentTime(0);
    }
  }, [activeTimer]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (timeLogId: string) => {
      return apiRequest("POST", "/api/timelogs/stop", { timeLogId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/productivity/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streaks"] });
      setCurrentTime(0);
      toast({
        title: "Timer stopped",
        description: "Your work session has been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStopTimer = () => {
    if (activeTimer) {
      stopTimerMutation.mutate(activeTimer.id);
    }
  };

  // Calculate reminder count
  const getReminderCount = () => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      
      const dueDate = startOfDay(new Date(task.dueDate));
      return dueDate.getTime() <= tomorrow.getTime();
    }).length;
  };

  const reminderCount = getReminderCount();

  return (
    <header className="gg-header border-b sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <GigsterLogo size="small" showText={false} />
                <span className="text-base sm:text-lg font-bold text-white hidden sm:inline" style={{ fontFamily: 'var(--font-display)' }}>
                  Gigster Garage
                </span>
              </div>
            </Link>
            
            {/* Active Timer Display (compact) */}
            {activeTimer && activeTimer.isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopTimer}
                disabled={stopTimerMutation.isPending}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 hover:bg-white/30 transition-colors"
                title="Click to stop timer"
              >
                <Clock size={14} className="text-white animate-pulse" />
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {formatDuration(currentTime)}
                </span>
              </Button>
            )}
            
            {/* Search - centered and prominent */}
            <div className="flex-1 max-w-md hidden sm:block">
              <GlobalSearch className="w-full" />
            </div>
          </div>
          
          {/* Right: Compact utilities */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search */}
            <div className="sm:hidden">
              <GlobalSearch className="w-full" />
            </div>
            
            {/* Main Menu Buttons - visible on larger screens */}
            <div className="hidden md:flex items-center gap-1">
              {/* Core Features Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 text-xs font-medium px-2 h-8"
                    data-testid="button-core-features"
                  >
                    <Home size={14} className="mr-1" />
                    Core
                    <ChevronDown size={12} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Core Features</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {coreFeatures.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="cursor-pointer"
                        data-testid={`menu-core-${item.id}`}
                      >
                        <ItemIcon size={14} className="mr-2" />
                        {item.title}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Business Operations Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 text-xs font-medium px-2 h-8"
                    data-testid="button-business-ops"
                  >
                    <Building size={14} className="mr-1" />
                    Business
                    <ChevronDown size={12} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Business Operations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {businessOperations.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="cursor-pointer"
                        data-testid={`menu-business-${item.id}`}
                      >
                        <ItemIcon size={14} className="mr-2" />
                        {item.title}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 text-xs font-medium px-2 h-8"
                    data-testid="button-help-menu"
                  >
                    <HelpCircle size={14} className="mr-1" />
                    Help
                    <ChevronDown size={12} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Help & Resources</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {helpItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => {
                          if (item.action === 'keyboard') {
                            openKeyboardShortcuts();
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }}
                        className="cursor-pointer"
                        data-testid={`menu-help-${item.id}`}
                      >
                        <ItemIcon size={14} className="mr-2" />
                        {item.title}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Navigation Menu (hamburger with full menu) */}
            <NavigationMenu />
            
            {/* Demo Mode Indicator */}
            <DemoModeIndicator />
            
            {/* User Menu with Admin Badge inside */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 relative p-1.5 sm:p-2"
                  data-testid="button-user-menu"
                  title="Account"
                >
                  <User size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <span>{user?.name}</span>
                  {user?.role === 'admin' && (
                    <span className="bg-[#0B1D3A] text-white px-1.5 py-0.5 rounded text-xs font-medium">
                      {t("admin")}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer"
                  data-testid="menu-settings"
                >
                  <Settings size={16} className="mr-2" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/user-manual")}
                  className="cursor-pointer"
                  data-testid="menu-user-manual"
                >
                  <BookOpen size={16} className="mr-2" />
                  User Manual
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openKeyboardShortcuts()}
                  className="cursor-pointer"
                  data-testid="menu-keyboard-shortcuts"
                >
                  <Keyboard size={16} className="mr-2" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer text-red-600"
                  data-testid="menu-logout"
                >
                  <LogOut size={16} className="mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
