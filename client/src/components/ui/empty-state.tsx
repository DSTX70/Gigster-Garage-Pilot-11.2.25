import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
      data-testid="empty-state"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} data-testid="empty-state-action">
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            data-testid="empty-state-secondary-action"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateCardProps extends EmptyStateProps {
  variant?: "default" | "dashed";
}

export function EmptyStateCard({
  variant = "default",
  className,
  ...props
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        variant === "dashed" && "border-2 border-dashed border-muted-foreground/25",
        variant === "default" && "border bg-card",
        className
      )}
    >
      <EmptyState {...props} />
    </div>
  );
}
