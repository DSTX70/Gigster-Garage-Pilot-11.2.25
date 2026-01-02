import {
  Home,
  FileCheck,
  Briefcase,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Building,
  Presentation,
  BarChart3,
  TrendingUp,
  Eye,
  Brain,
  Zap,
  Clock,
  Bot,
  Settings,
  Database,
  Archive,
  Shield,
  Key,
  Webhook,
  Mail,
  Activity,
  Gauge,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';

export type PlanTier = 'free' | 'plus' | 'pro';
export type UserRole = 'user' | 'admin';

export interface NavItem {
  id: string;
  path: string;
  title: string;
  icon: LucideIcon;
  iconName: string;
  requiresAuth: boolean;
  rolesAllowed: UserRole[];
  requiredPlan?: PlanTier;
  featureFlag?: string;
  badge?: string;
  description?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  collapsed?: boolean;
}

export const navigationGroups: NavGroup[] = [
  {
    id: 'core',
    title: 'Core',
    icon: Home,
    items: [
      {
        id: 'home',
        path: '/',
        title: 'Home',
        icon: Home,
        iconName: 'Home',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Dashboard and overview',
      },
      {
        id: 'tasks',
        path: '/tasks',
        title: 'Tasks',
        icon: FileCheck,
        iconName: 'FileCheck',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Manage tasks and to-dos',
      },
      {
        id: 'messages',
        path: '/messages',
        title: 'Messages',
        icon: MessageSquare,
        iconName: 'MessageSquare',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Team communication',
      },
    ],
  },
  {
    id: 'work',
    title: 'Work',
    icon: Briefcase,
    items: [
      {
        id: 'clients',
        path: '/clients',
        title: 'Clients',
        icon: Users,
        iconName: 'Users',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Client management',
      },
      {
        id: 'filing-cabinet',
        path: '/filing-cabinet',
        title: 'Filing Cabinet',
        icon: Archive,
        iconName: 'Archive',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Document storage',
      },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    icon: Building,
    items: [
      {
        id: 'invoices',
        path: '/invoices',
        title: 'Invoices',
        icon: FileText,
        iconName: 'FileText',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Billing and invoices',
      },
      {
        id: 'create-invoice',
        path: '/create-invoice',
        title: 'New Invoice',
        icon: FileText,
        iconName: 'FileText',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Create a new invoice',
      },
      {
        id: 'payments',
        path: '/payments',
        title: 'Payments',
        icon: Building,
        iconName: 'Building',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Payment tracking',
      },
      {
        id: 'create-proposal',
        path: '/create-proposal',
        title: 'Proposals',
        icon: Presentation,
        iconName: 'Presentation',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Create and manage proposals',
      },
      {
        id: 'create-contract',
        path: '/create-contract',
        title: 'Contracts',
        icon: FileCheck,
        iconName: 'FileCheck',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Contract management',
      },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    icon: BarChart3,
    items: [
      {
        id: 'productivity',
        path: '/productivity',
        title: 'Productivity',
        icon: TrendingUp,
        iconName: 'TrendingUp',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Productivity metrics',
      },
      {
        id: 'analytics',
        path: '/analytics',
        title: 'Analytics',
        icon: BarChart3,
        iconName: 'BarChart3',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Business analytics',
      },
      {
        id: 'advanced-reporting',
        path: '/advanced-reporting',
        title: 'Reports',
        icon: Eye,
        iconName: 'Eye',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        requiredPlan: 'plus',
        description: 'Advanced reporting',
      },
      {
        id: 'ai-insights',
        path: '/ai-insights',
        title: 'AI Insights',
        icon: Brain,
        iconName: 'Brain',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        requiredPlan: 'pro',
        description: 'AI-powered insights',
      },
      {
        id: 'predictive-analytics',
        path: '/predictive-analytics',
        title: 'Predictions',
        icon: Brain,
        iconName: 'Brain',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        requiredPlan: 'pro',
        description: 'Predictive analytics',
      },
    ],
  },
  {
    id: 'automation',
    title: 'Automation',
    icon: Zap,
    collapsed: true,
    items: [
      {
        id: 'workflow-automation',
        path: '/workflow-automation',
        title: 'Workflows',
        icon: Zap,
        iconName: 'Zap',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Workflow automation',
      },
      {
        id: 'smart-scheduling',
        path: '/smart-scheduling',
        title: 'Smart Scheduling',
        icon: Clock,
        iconName: 'Clock',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        requiredPlan: 'plus',
        description: 'AI-powered scheduling',
      },
      {
        id: 'garage-assistant',
        path: '/garage-assistant',
        title: 'AI Assistant',
        icon: Bot,
        iconName: 'Bot',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'AI-powered assistant',
      },
      {
        id: 'gigster-coach',
        path: '/gigster-coach',
        title: 'Gigster Coach',
        icon: Brain,
        iconName: 'Brain',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Business coaching AI',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    collapsed: true,
    items: [
      {
        id: 'settings',
        path: '/settings',
        title: 'Preferences',
        icon: Settings,
        iconName: 'Settings',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'User preferences',
      },
      {
        id: 'settings-brand',
        path: '/settings/brand',
        title: 'Brand',
        icon: Briefcase,
        iconName: 'Briefcase',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Brand settings',
      },
      {
        id: 'settings-connections',
        path: '/settings/connections',
        title: 'Connections',
        icon: Key,
        iconName: 'Key',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Platform connections',
      },
      {
        id: 'custom-fields',
        path: '/custom-fields',
        title: 'Custom Fields',
        icon: Database,
        iconName: 'Database',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Custom field definitions',
      },
      {
        id: 'team-collaboration',
        path: '/team-collaboration',
        title: 'Team',
        icon: Users,
        iconName: 'Users',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Team collaboration',
      },
      {
        id: 'email-management',
        path: '/email-management',
        title: 'Email',
        icon: Mail,
        iconName: 'Mail',
        requiresAuth: true,
        rolesAllowed: ['user', 'admin'],
        description: 'Email settings',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    icon: Shield,
    collapsed: true,
    items: [
      {
        id: 'admin-dashboard',
        path: '/admin',
        title: 'Admin Dashboard',
        icon: Shield,
        iconName: 'Shield',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'Admin control panel',
      },
      {
        id: 'admin-diagnostics',
        path: '/admin/diagnostics',
        title: 'Diagnostics',
        icon: Activity,
        iconName: 'Activity',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'System diagnostics',
      },
      {
        id: 'agent-management',
        path: '/agent-management',
        title: 'Agent Management',
        icon: Bot,
        iconName: 'Bot',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'Manage AI agents',
      },
      {
        id: 'monitoring',
        path: '/monitoring',
        title: 'Monitoring',
        icon: Gauge,
        iconName: 'Gauge',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'Production monitoring',
      },
      {
        id: 'ops-social-queue',
        path: '/ops/social-queue',
        title: 'Social Queue',
        icon: MessageSquare,
        iconName: 'MessageSquare',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'Social media queue',
      },
      {
        id: 'ops-rate-limits',
        path: '/ops/rate-limits',
        title: 'Rate Limits',
        icon: Gauge,
        iconName: 'Gauge',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'API rate limits',
      },
      {
        id: 'api-webhooks',
        path: '/api-webhooks',
        title: 'API & Webhooks',
        icon: Webhook,
        iconName: 'Webhook',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'API and webhook settings',
      },
      {
        id: 'sso-management',
        path: '/sso-management',
        title: 'SSO',
        icon: Key,
        iconName: 'Key',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        requiredPlan: 'pro',
        description: 'Single sign-on',
      },
      {
        id: 'permissions-management',
        path: '/permissions-management',
        title: 'Permissions',
        icon: Shield,
        iconName: 'Shield',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'User permissions',
      },
      {
        id: 'audit-logging',
        path: '/audit-logging',
        title: 'Audit Logs',
        icon: FileText,
        iconName: 'FileText',
        requiresAuth: true,
        rolesAllowed: ['admin'],
        description: 'Audit trail',
      },
    ],
  },
];

export function getAllNavItems(): NavItem[] {
  return navigationGroups.flatMap(group => group.items);
}

export function getNavItemByPath(path: string): NavItem | undefined {
  return getAllNavItems().find(item => item.path === path);
}

export function getVisibleNavGroups(
  isAuthenticated: boolean,
  userRole: UserRole,
  userPlan?: PlanTier
): NavGroup[] {
  return navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.requiresAuth && !isAuthenticated) return false;
        if (!item.rolesAllowed.includes(userRole)) return false;
        return true;
      }),
    }))
    .filter(group => group.items.length > 0);
}

export function canAccessNavItem(
  item: NavItem,
  isAuthenticated: boolean,
  userRole: UserRole,
  userPlan?: PlanTier
): boolean {
  if (item.requiresAuth && !isAuthenticated) return false;
  if (!item.rolesAllowed.includes(userRole)) return false;
  return true;
}
