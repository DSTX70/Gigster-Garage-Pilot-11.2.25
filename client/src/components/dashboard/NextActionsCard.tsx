import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CheckSquare,
  Receipt,
  FileText,
  Mail,
  Plus,
  AlertTriangle,
  Clock,
  Palette,
  Users,
  Sparkles,
} from "lucide-react";
import type { Task, Invoice, Proposal, Message } from "@shared/schema";

type NextActionType = 
  | "finish-onboarding"
  | "add-brand"
  | "add-first-client"
  | "overdue"
  | "due-soon"
  | "invoice-draft"
  | "proposal-draft"
  | "unread-messages"
  | "fallback";

interface ServerNextAction {
  key: string;
  title: string;
  description?: string;
  ctaLabel: string;
  href: string;
  priority: number;
  urgent?: boolean;
}

interface NextAction {
  type: NextActionType;
  title: string;
  subtitle?: string;
  primaryAction: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  urgent?: boolean;
}

interface NextActionsCardProps {
  onNewTask?: () => void;
}

export function NextActionsCard({ onNewTask }: NextActionsCardProps) {
  const { data: serverAction, isLoading: serverLoading } = useQuery<ServerNextAction>({
    queryKey: ["/api/next-action"],
    staleTime: 1000 * 30,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const now = new Date();

  const getNextAction = (): NextAction => {
    if (serverAction && serverAction.priority <= 3) {
      return {
        type: serverAction.key as NextActionType,
        title: serverAction.title,
        subtitle: serverAction.description,
        primaryAction: {
          label: serverAction.ctaLabel,
          href: serverAction.href,
        },
        urgent: serverAction.urgent,
      };
    }
    const overdueTasks = tasks
      .filter(task => {
        if (task.completed || !task.dueDate) return false;
        return new Date(task.dueDate) < now;
      })
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
      });

    if (overdueTasks.length > 0) {
      const task = overdueTasks[0];
      return {
        type: "overdue",
        title: `Your next move: fix "${task.title}" — it's overdue.`,
        subtitle: task.projectId ? `Project task` : undefined,
        primaryAction: {
          label: "Open task",
          href: `/tasks?taskId=${task.id}`,
        },
        secondaryAction: {
          label: "View all tasks",
          href: "/tasks?filter=overdue",
        },
        urgent: true,
      };
    }

    const dueSoonTasks = tasks
      .filter(task => {
        if (task.completed || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 48 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    if (dueSoonTasks.length > 0) {
      const task = dueSoonTasks[0];
      const dueDate = new Date(task.dueDate!);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeDiff / (60 * 60 * 1000));
      
      let when = "soon";
      if (hoursUntil < 1) {
        when = "in less than an hour";
      } else if (hoursUntil < 24) {
        when = `in ${hoursUntil} hour${hoursUntil === 1 ? '' : 's'}`;
      } else {
        when = "tomorrow";
      }

      return {
        type: "due-soon",
        title: `Next up: "${task.title}" is due ${when}.`,
        subtitle: task.projectId ? `Project task` : undefined,
        primaryAction: {
          label: "Open task",
          href: `/tasks?taskId=${task.id}`,
        },
        secondaryAction: {
          label: "View all tasks",
          href: "/tasks?filter=due-soon",
        },
      };
    }

    const draftInvoices = invoices.filter(
      inv => inv.status === "draft"
    );

    if (draftInvoices.length > 0) {
      const invoice = draftInvoices[0];
      return {
        type: "invoice-draft",
        title: `Next up: finish and send invoice #${invoice.invoiceNumber || invoice.id.slice(0, 8)} to ${invoice.clientName || "client"}.`,
        subtitle: invoice.totalAmount ? `$${Number(invoice.totalAmount).toLocaleString()}` : undefined,
        primaryAction: {
          label: "Continue invoice",
          href: `/create-invoice?id=${invoice.id}`,
        },
        secondaryAction: {
          label: "View all invoices",
          href: "/invoices",
        },
      };
    }

    const draftProposals = proposals.filter(
      prop => prop.status === "draft"
    );

    if (draftProposals.length > 0) {
      const proposal = draftProposals[0];
      return {
        type: "proposal-draft",
        title: `Next up: finalize the proposal for ${proposal.clientName || "client"}.`,
        subtitle: proposal.title || undefined,
        primaryAction: {
          label: "Continue proposal",
          href: `/create-proposal?id=${proposal.id}`,
        },
        secondaryAction: {
          label: "View all proposals",
          href: "/proposals",
        },
      };
    }

    const unreadMessages = messages.filter(msg => !msg.isRead);

    if (unreadMessages.length > 0) {
      return {
        type: "unread-messages",
        title: `Next up: you have ${unreadMessages.length} unread message${unreadMessages.length === 1 ? '' : 's'} to review.`,
        subtitle: `Check your inbox`,
        primaryAction: {
          label: "Open messages",
          href: "/messages",
        },
        secondaryAction: {
          label: "View all messages",
          href: "/messages",
        },
      };
    }

    return {
      type: "fallback",
      title: "Next up: create a new invoice or task to keep things moving.",
      primaryAction: {
        label: "+ New",
        onClick: onNewTask,
      },
      secondaryAction: {
        label: "View all tasks",
        href: "/tasks",
      },
    };
  };

  const nextAction = getNextAction();

  const getIcon = () => {
    switch (nextAction.type) {
      case "finish-onboarding":
        return <Sparkles className="h-5 w-5 text-emerald-500" />;
      case "add-brand":
        return <Palette className="h-5 w-5 text-purple-500" />;
      case "add-first-client":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "due-soon":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "invoice-draft":
        return <Receipt className="h-5 w-5 text-green-600" />;
      case "proposal-draft":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "unread-messages":
        return <Mail className="h-5 w-5 text-indigo-600" />;
      default:
        return <Plus className="h-5 w-5 text-[#2EC5C2]" />;
    }
  };

  if (serverLoading) {
    return (
      <Card className="border border-gray-200 bg-white" data-testid="next-actions-card-loading">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border ${nextAction.urgent ? 'border-l-4 border-l-red-500 border-red-200 bg-red-50/50' : 'border-gray-200 bg-white'}`}
      data-testid="next-actions-card"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Next up
              </span>
              {nextAction.urgent && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  Urgent
                </Badge>
              )}
            </div>
            
            <p className={`text-sm sm:text-base font-medium ${nextAction.urgent ? 'text-red-800' : 'text-gray-900'}`}>
              {nextAction.title}
            </p>
            
            {nextAction.subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {nextAction.subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {nextAction.primaryAction.href ? (
              <Link href={nextAction.primaryAction.href}>
                <Button 
                  size="sm" 
                  className="text-white"
                  style={{ background: 'var(--brand-mint, #2EC5C2)' }}
                  data-testid="next-action-primary"
                >
                  {nextAction.primaryAction.label}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button 
                size="sm" 
                onClick={nextAction.primaryAction.onClick}
                className="text-white"
                style={{ background: 'var(--brand-mint, #2EC5C2)' }}
                data-testid="next-action-primary"
              >
                {nextAction.primaryAction.label}
              </Button>
            )}
            
            {nextAction.secondaryAction && (
              <Link href={nextAction.secondaryAction.href}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 hidden sm:flex"
                  data-testid="next-action-secondary"
                >
                  {nextAction.secondaryAction.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
