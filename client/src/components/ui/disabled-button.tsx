import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DisabledButtonProps extends ButtonProps {
  disabledReason?: string;
}

export function DisabledButton({
  disabled,
  disabledReason,
  children,
  className,
  ...props
}: DisabledButtonProps) {
  const isDisabled = disabled || !!disabledReason;

  if (isDisabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block">
            <Button
              {...props}
              disabled
              className={cn("pointer-events-none", className)}
              data-testid={props["data-testid"]}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledReason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button {...props} disabled={isDisabled} className={className}>
      {children}
    </Button>
  );
}
