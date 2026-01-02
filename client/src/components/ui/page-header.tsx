import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  primaryAction?: ActionItem;
  secondaryActions?: ActionItem[];
  filterSlot?: React.ReactNode;
  backAction?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  primaryAction,
  secondaryActions = [],
  filterSlot,
  backAction,
  className,
}: PageHeaderProps) {
  const visibleSecondaryActions = secondaryActions.slice(0, 2);
  const overflowActions = secondaryActions.slice(2);

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {backAction && (
            <Button
              variant="ghost"
              size="icon"
              onClick={backAction}
              className="h-8 w-8"
              data-testid="page-header-back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
          )}
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2 hidden sm:flex">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="page-header-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5" data-testid="page-header-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {visibleSecondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="hidden sm:inline-flex"
              data-testid={`page-header-secondary-action-${index}`}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))}

          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  data-testid="page-header-overflow-menu"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    data-testid={`page-header-overflow-action-${index}`}
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(secondaryActions.length > 0 || primaryAction) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden"
                  data-testid="page-header-mobile-menu"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {primaryAction && (
            <Button
              variant={primaryAction.variant || "default"}
              size="sm"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              data-testid="page-header-primary-action"
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">{primaryAction.label}</span>
              {primaryAction.icon && (
                <span className="sm:hidden">
                  <primaryAction.icon className="h-4 w-4" />
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {filterSlot && (
        <div className="mt-4" data-testid="page-header-filters">
          {filterSlot}
        </div>
      )}
    </div>
  );
}
