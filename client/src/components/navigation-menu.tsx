import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  X,
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
      { id: 'clients', title: 'Clients', icon: Users, path: '/clients' },
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
    new Set(['core', 'business'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setSearchQuery('');
    setSelectedIndex(-1);
    setIsOpen(false);
    navigate(path);
  };

  const visibleSections = navigationSections.filter(section => 
    !section.adminOnly || isAdmin
  );

  // Get all flat items for search
  const getAllItems = useCallback(() => {
    const items: (NavigationItem & { sectionTitle: string })[] = [];
    visibleSections.forEach(section => {
      section.items.forEach(item => {
        if (!item.adminOnly || isAdmin) {
          items.push({ ...item, sectionTitle: section.title });
        }
      });
    });
    return items;
  }, [visibleSections, isAdmin]);

  // Filter items based on search
  const filteredItems = searchQuery
    ? getAllItems().filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-amber-200 font-semibold">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchQuery) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex].path);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setSelectedIndex(-1);
        break;
    }
  }, [searchQuery, filteredItems, selectedIndex, handleItemClick]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset search when menu closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
        <DropdownMenuLabel className="text-lg font-semibold text-[#0B1D3A]">
          Navigation
        </DropdownMenuLabel>
        
        {/* Search Input */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Find a page..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="pl-8 pr-8 h-8 text-sm"
              data-testid="nav-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedIndex(-1);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Search Results */}
        {searchQuery ? (
          <div className="py-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const ItemIcon = item.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <DropdownMenuItem
                    key={item.id}
                    className={`cursor-pointer py-2 px-3 mx-1 rounded-md ${
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleItemClick(item.path)}
                    data-testid={`search-result-${item.id}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <ItemIcon size={16} className="text-[#0B1D3A]/70 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 font-medium">
                          {highlightMatch(item.title, searchQuery)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {item.sectionTitle}
                        </span>
                      </div>
                      {item.adminOnly && (
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No results found</p>
                <p className="text-xs text-gray-400">
                  Try Global Search <span className="font-mono bg-gray-100 px-1 rounded">Ctrl+K</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Normal Section View */
          <div className="space-y-1 py-1">
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
                      <div className="flex items-center gap-2">
                        <SectionIcon size={16} className="text-[#0B1D3A]" />
                        <span className="font-medium text-gray-900 text-sm">
                          {section.title}
                        </span>
                        {section.adminOnly && (
                          <span className="bg-[#0B1D3A] text-white px-1.5 py-0.5 rounded text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-0.5 pl-4">
                    {visibleItems.map((item) => {
                      const ItemIcon = item.icon;
                      
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          className="cursor-pointer py-1.5 px-3 rounded-md hover:bg-gray-50"
                          onClick={() => handleItemClick(item.path)}
                          data-testid={`nav-item-${item.id}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <ItemIcon size={14} className="text-[#0B1D3A]/60" />
                            <span className="text-gray-700 text-sm">
                              {item.title}
                            </span>
                            {item.adminOnly && (
                              <span className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-xs font-medium ml-auto">
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
        )}
        
        <DropdownMenuSeparator />
        
        {/* Quick Actions */}
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-8"
              onClick={() => handleItemClick('/tasks?new=true')}
              data-testid="quick-new-task"
            >
              <Plus size={12} className="mr-1" />
              New Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-8"
              onClick={() => handleItemClick('/create-invoice')}
              data-testid="quick-new-invoice"
            >
              <FileText size={12} className="mr-1" />
              New Invoice
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavigationMenu;