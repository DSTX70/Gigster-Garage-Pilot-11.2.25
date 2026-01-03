import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Clock,
  FileText,
  Users,
  Folder,
  Mail,
  Plus,
  Play,
  Pause,
  DollarSign,
  FileSignature,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Zap,
  Calendar,
  Archive,
  Bot,
  Briefcase,
  TrendingUp,
  FileCheck,
  Presentation,
  UserPlus,
  MessageSquare,
  Activity,
  Inbox,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Project, Client, Invoice, TimeLog } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface RecentPage {
  title: string;
  url: string;
  iconName: string;
  timestamp: number;
}

interface RecentEntity {
  id: string;
  type: "client" | "project" | "invoice" | "task";
  title: string;
  url: string;
  timestamp: number;
}

interface UniversalSearchResult {
  id: string;
  type: "task" | "project" | "client" | "invoice" | "message";
  title: string;
  description?: string;
  url: string;
  metadata?: {
    status?: string;
    priority?: string;
    dueDate?: string;
    projectName?: string;
    assigneeName?: string;
  };
}

// Icon mapping for rehydration
const iconMap: Record<string, ReactNode> = {
  Clock: <Clock className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Folder: <Folder className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  FileSignature: <FileSignature className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
  Archive: <Archive className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Bot: <Bot className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  FileCheck: <FileCheck className="h-4 w-4" />,
  Presentation: <Presentation className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  MessageSquare: <MessageSquare className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  Inbox: <Inbox className="h-4 w-4" />,
};

interface SearchResult {
  id: string;
  type: "task" | "project" | "client" | "invoice";
  title: string;
  description?: string;
  url: string;
  metadata?: {
    status?: string;
    priority?: string;
    dueDate?: string;
  };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([]);

  // Debounce search for server-side API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Use server-side universal search
  const { data: searchResults = [], isLoading: isSearching } = useQuery<UniversalSearchResult[]>({
    queryKey: ["/api/search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 10000,
  });

  const { data: activeTimer } = useQuery<TimeLog | null>({
    queryKey: ["/api/timelogs/active"],
    enabled: open,
  });

  // Load recent pages and entities from localStorage
  useEffect(() => {
    const storedPages = localStorage.getItem("recent-pages");
    if (storedPages) {
      try {
        setRecentPages(JSON.parse(storedPages));
      } catch (e) {
        console.error("Failed to parse recent pages", e);
      }
    }
    
    const storedEntities = localStorage.getItem("recent-entities");
    if (storedEntities) {
      try {
        setRecentEntities(JSON.parse(storedEntities));
      } catch (e) {
        console.error("Failed to parse recent entities", e);
      }
    }
  }, [open]);

  // Save page visit
  const savePageVisit = useCallback((title: string, url: string, iconName: string) => {
    setRecentPages((prev) => {
      const newPages = [
        { title, url, iconName, timestamp: Date.now() },
        ...prev.filter((p) => p.url !== url),
      ].slice(0, 10);
      localStorage.setItem("recent-pages", JSON.stringify(newPages));
      return newPages;
    });
  }, []);

  // Save entity visit (for clients, projects, invoices, tasks)
  const saveEntityVisit = useCallback((entity: Omit<RecentEntity, "timestamp">) => {
    setRecentEntities((prev) => {
      const newEntities = [
        { ...entity, timestamp: Date.now() },
        ...prev.filter((e) => e.id !== entity.id || e.type !== entity.type),
      ].slice(0, 15);
      localStorage.setItem("recent-entities", JSON.stringify(newEntities));
      return newEntities;
    });
  }, []);

  // Toggle command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (description: string) => {
      return apiRequest("POST", "/api/timelogs/start", { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs/active"] });
      toast({
        title: "Timer started",
        description: "Your work session has begun",
      });
      setOpen(false);
    },
  });

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (timeLogId: string) => {
      return apiRequest("POST", "/api/timelogs/stop", { timeLogId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs"] });
      toast({
        title: "Timer stopped",
        description: "Your work session has been saved",
      });
      setOpen(false);
    },
  });

  // Logout mutation
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
      setOpen(false);
    },
  });

  // Group search results by type for better organization
  const groupedResults = {
    tasks: searchResults.filter(r => r.type === "task"),
    projects: searchResults.filter(r => r.type === "project"),
    clients: searchResults.filter(r => r.type === "client"),
    invoices: searchResults.filter(r => r.type === "invoice"),
    messages: searchResults.filter(r => r.type === "message"),
  };

  // Get recent entities by type
  const recentClients = recentEntities.filter(e => e.type === "client").slice(0, 3);
  const recentProjects = recentEntities.filter(e => e.type === "project").slice(0, 3);
  const recentInvoices = recentEntities.filter(e => e.type === "invoice").slice(0, 3);
  const recentTasks = recentEntities.filter(e => e.type === "task").slice(0, 3);
  const hasRecentEntities = recentClients.length > 0 || recentProjects.length > 0 || 
                            recentInvoices.length > 0 || recentTasks.length > 0;

  // Icon for search result types
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task": return <Clock className="h-4 w-4" />;
      case "project": return <Folder className="h-4 w-4" />;
      case "client": return <Users className="h-4 w-4" />;
      case "invoice": return <FileText className="h-4 w-4" />;
      case "message": return <Mail className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: UniversalSearchResult) => {
    // Only save entity visits for supported types (not messages)
    const supportedTypes: RecentEntity["type"][] = ["client", "project", "invoice", "task"];
    if (supportedTypes.includes(result.type as RecentEntity["type"])) {
      saveEntityVisit({
        id: result.id,
        type: result.type as RecentEntity["type"],
        title: result.title,
        url: result.url,
      });
    }
    navigate(result.url);
    setOpen(false);
  };

  // Quick actions - Create documents
  const createActions = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Create Invoice",
      action: () => {
        savePageVisit("Create Invoice", "/create-invoice", "FileText");
        navigate("/create-invoice");
        setOpen(false);
      },
      shortcut: "I",
    },
    {
      icon: <FileSignature className="h-4 w-4" />,
      label: "Create Proposal",
      action: () => {
        savePageVisit("Create Proposal", "/create-proposal", "FileSignature");
        navigate("/create-proposal");
        setOpen(false);
      },
      shortcut: "P",
    },
    {
      icon: <FileCheck className="h-4 w-4" />,
      label: "Create Contract",
      action: () => {
        savePageVisit("Create Contract", "/create-contract", "FileCheck");
        navigate("/create-contract");
        setOpen(false);
      },
      shortcut: "C",
    },
    {
      icon: <Presentation className="h-4 w-4" />,
      label: "Create Presentation",
      action: () => {
        savePageVisit("Create Presentation", "/create-presentation", "Presentation");
        navigate("/create-presentation");
        setOpen(false);
      },
    },
    {
      icon: <UserPlus className="h-4 w-4" />,
      label: "New Client",
      action: () => {
        savePageVisit("Clients", "/clients", "UserPlus");
        navigate("/clients");
        setOpen(false);
      },
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create Task",
      action: () => {
        savePageVisit("Create Task", "/tasks", "Plus");
        navigate("/tasks");
        setOpen(false);
      },
      shortcut: "N",
    },
    {
      icon: <Folder className="h-4 w-4" />,
      label: "New Project",
      action: () => {
        navigate("/");
        setOpen(false);
      },
    },
  ];

  // Quick actions - Utilities
  const quickActions = [
    {
      icon: activeTimer ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
      label: activeTimer ? "Stop Timer" : "Start Timer",
      action: () => {
        if (activeTimer) {
          stopTimerMutation.mutate(activeTimer.id);
        } else {
          startTimerMutation.mutate("Working");
        }
      },
      shortcut: "T",
    },
    {
      icon: <Inbox className="h-4 w-4" />,
      label: "Coach Inbox",
      action: () => {
        savePageVisit("Coach Inbox", "/gigster-coach/suggestions", "Inbox");
        navigate("/gigster-coach/suggestions");
        setOpen(false);
      },
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Open Coach",
      action: () => {
        savePageVisit("Gigster Coach", "/gigster-coach", "MessageSquare");
        navigate("/gigster-coach");
        setOpen(false);
      },
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "System Status",
      action: () => {
        savePageVisit("System Status", "/system-status", "Activity");
        navigate("/system-status");
        setOpen(false);
      },
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      action: () => {
        savePageVisit("Settings", "/settings", "Settings");
        navigate("/settings");
        setOpen(false);
      },
    },
  ];

  // Navigation shortcuts
  const navigationShortcuts = [
    {
      iconName: "Home",
      label: "Dashboard",
      url: "/",
    },
    {
      iconName: "Clock",
      label: "Tasks",
      url: "/tasks",
    },
    {
      iconName: "BarChart3",
      label: "Productivity",
      url: "/productivity",
    },
    {
      iconName: "FileText",
      label: "Invoices",
      url: "/invoices",
    },
    {
      iconName: "Users",
      label: "Clients",
      url: "/clients",
    },
    {
      iconName: "DollarSign",
      label: "Payments",
      url: "/payments",
    },
    {
      iconName: "Archive",
      label: "Filing Cabinet",
      url: "/filing-cabinet",
    },
    {
      iconName: "Zap",
      label: "Workflow Automation",
      url: "/workflow-automation",
    },
  ];

  if (isAdmin) {
    navigationShortcuts.push(
      {
        iconName: "Bot",
        label: "Agent Management",
        url: "/agent-management",
      },
      {
        iconName: "TrendingUp",
        label: "Analytics Dashboard",
        url: "/dashboard",
      }
    );
  }

  const handleNavigate = (url: string, title: string, iconName: string) => {
    savePageVisit(title, url, iconName);
    navigate(url);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Create Actions */}
        {!search && (
          <CommandGroup heading="Create">
            {createActions.map((action) => (
              <CommandItem
                key={action.label}
                onSelect={action.action}
                data-testid={`command-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {action.icon}
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {action.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={action.action}
                  data-testid={`command-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Pages */}
        {!search && recentPages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Pages">
              {recentPages.slice(0, 5).map((page) => (
                <CommandItem
                  key={page.url}
                  onSelect={() => handleNavigate(page.url, page.title, page.iconName)}
                >
                  {iconMap[page.iconName] || <Home className="h-4 w-4" />}
                  <span>{page.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(page.timestamp).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Clients */}
        {!search && recentClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Clients">
              {recentClients.map((entity) => (
                <CommandItem
                  key={`recent-client-${entity.id}`}
                  onSelect={() => {
                    navigate(entity.url);
                    setOpen(false);
                  }}
                  data-testid={`command-recent-client-${entity.id}`}
                >
                  <Users className="h-4 w-4" />
                  <span>{entity.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Projects */}
        {!search && recentProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Projects">
              {recentProjects.map((entity) => (
                <CommandItem
                  key={`recent-project-${entity.id}`}
                  onSelect={() => {
                    navigate(entity.url);
                    setOpen(false);
                  }}
                  data-testid={`command-recent-project-${entity.id}`}
                >
                  <Folder className="h-4 w-4" />
                  <span>{entity.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Invoices */}
        {!search && recentInvoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Invoices">
              {recentInvoices.map((entity) => (
                <CommandItem
                  key={`recent-invoice-${entity.id}`}
                  onSelect={() => {
                    navigate(entity.url);
                    setOpen(false);
                  }}
                  data-testid={`command-recent-invoice-${entity.id}`}
                >
                  <FileText className="h-4 w-4" />
                  <span>{entity.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Tasks */}
        {!search && recentTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Tasks">
              {recentTasks.map((entity) => (
                <CommandItem
                  key={`recent-task-${entity.id}`}
                  onSelect={() => {
                    navigate(entity.url);
                    setOpen(false);
                  }}
                  data-testid={`command-recent-task-${entity.id}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>{entity.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Server-side Search Results */}
        {search && isSearching && (
          <div className="p-4 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        )}

        {/* Search Results - Tasks */}
        {search && groupedResults.tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {groupedResults.tasks.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result)}
                  data-testid={`command-task-${result.id}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>{result.title}</span>
                  {result.metadata?.priority === "high" && (
                    <Badge className="ml-auto bg-red-100 text-red-800 text-xs">High</Badge>
                  )}
                  {result.metadata?.status === "completed" && (
                    <Badge className="ml-auto bg-green-100 text-green-800 text-xs">Done</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Projects */}
        {search && groupedResults.projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {groupedResults.projects.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result)}
                  data-testid={`command-project-${result.id}`}
                >
                  <Folder className="h-4 w-4" />
                  <span>{result.title}</span>
                  {result.metadata?.status && (
                    <Badge className="ml-auto" variant="secondary">{result.metadata.status}</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Clients */}
        {search && groupedResults.clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {groupedResults.clients.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result)}
                  data-testid={`command-client-${result.id}`}
                >
                  <Users className="h-4 w-4" />
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
                      {result.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Invoices */}
        {search && groupedResults.invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Invoices">
              {groupedResults.invoices.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result)}
                  data-testid={`command-invoice-${result.id}`}
                >
                  <FileText className="h-4 w-4" />
                  <span>{result.title}</span>
                  {result.metadata?.status && (
                    <Badge className="ml-auto" variant="secondary">{result.metadata.status}</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Messages */}
        {search && groupedResults.messages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Messages">
              {groupedResults.messages.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result)}
                  data-testid={`command-message-${result.id}`}
                >
                  <Mail className="h-4 w-4" />
                  <span>{result.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Navigation */}
        {!search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Navigation">
              {navigationShortcuts.map((nav) => (
                <CommandItem
                  key={nav.url}
                  onSelect={() => handleNavigate(nav.url, nav.label, nav.iconName)}
                >
                  {iconMap[nav.iconName] || <Home className="h-4 w-4" />}
                  <span>{nav.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Account Actions */}
        {!search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => logoutMutation.mutate()}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>

      <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ↑↓
          </kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⏎
          </kbd>
          <span>Select</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ESC
          </kbd>
          <span>Close</span>
        </div>
      </div>
    </CommandDialog>
  );
}
