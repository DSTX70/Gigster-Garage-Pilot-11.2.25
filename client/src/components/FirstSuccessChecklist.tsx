import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  User,
  ClipboardList,
  Users,
  FileText,
  FolderOpen,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  url: string;
  checkKey: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your name and business info",
    icon: User,
    url: "/settings",
    checkKey: "profile",
  },
  {
    id: "first_task",
    title: "Create your first task",
    description: "Track what you're working on",
    icon: ClipboardList,
    url: "/tasks",
    checkKey: "first_task",
  },
  {
    id: "first_client",
    title: "Add your first client",
    description: "Keep your contacts organized",
    icon: Users,
    url: "/clients",
    checkKey: "first_client",
  },
  {
    id: "first_invoice",
    title: "Create an invoice",
    description: "Bill for your work professionally",
    icon: FileText,
    url: "/create-invoice",
    checkKey: "first_invoice",
  },
  {
    id: "explore_features",
    title: "Explore key features",
    description: "Discover productivity tools",
    icon: FolderOpen,
    url: "/productivity",
    checkKey: "explore_features",
  },
];

interface FirstSuccessChecklistProps {
  collapsed?: boolean;
  onDismiss?: () => void;
}

export function FirstSuccessChecklist({ collapsed = false, onDismiss }: FirstSuccessChecklistProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({});
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("first-success-dismissed") === "true";
  });

  const { data: user } = useQuery<{
    id: string;
    hasCompletedOnboarding?: boolean;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: tasks = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/clients"],
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/complete-onboarding", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Onboarding complete!",
        description: "You've mastered the basics. Keep building!",
      });
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem("first-success-completions");
    if (stored) {
      try {
        setLocalCompletions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse completions", e);
      }
    }
  }, []);

  const markStepComplete = (stepId: string) => {
    setLocalCompletions((prev) => {
      const updated = { ...prev, [stepId]: true };
      localStorage.setItem("first-success-completions", JSON.stringify(updated));
      return updated;
    });
  };

  const getStepCompletion = (step: OnboardingStep): boolean => {
    switch (step.id) {
      case "profile":
        return !!(user?.firstName && user?.lastName) || localCompletions[step.id];
      case "first_task":
        return tasks.length > 0 || localCompletions[step.id];
      case "first_client":
        return clients.length > 0 || localCompletions[step.id];
      case "first_invoice":
        return invoices.length > 0 || localCompletions[step.id];
      case "explore_features":
        return localCompletions[step.id] || false;
      default:
        return localCompletions[step.id] || false;
    }
  };

  const completedSteps = ONBOARDING_STEPS.filter((step) => getStepCompletion(step)).length;
  const progress = (completedSteps / ONBOARDING_STEPS.length) * 100;
  const allComplete = completedSteps === ONBOARDING_STEPS.length;

  const handleStepClick = (step: OnboardingStep) => {
    markStepComplete(step.id);
    navigate(step.url);
  };

  const handleDismiss = () => {
    if (allComplete) {
      completeOnboardingMutation.mutate();
    }
    localStorage.setItem("first-success-dismissed", "true");
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed || user?.hasCompletedOnboarding) {
    return null;
  }

  if (allComplete && !isExpanded) {
    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800" data-testid="card-onboarding-complete">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Onboarding complete!</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">You've mastered the basics</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
              data-testid="button-dismiss-onboarding"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden" data-testid="card-first-success-checklist">
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-[#2EC5C2] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#2EC5C2]/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#2EC5C2]" />
            </div>
            <div>
              <CardTitle className="text-lg">First Success Checklist</CardTitle>
              <CardDescription>Complete these steps to get the most from Gigster Garage</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {completedSteps}/{ONBOARDING_STEPS.length}
            </Badge>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid="button-toggle-checklist"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((step) => {
              const isComplete = getStepCompletion(step);
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                    ${isComplete
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                      : "hover:bg-muted/50"
                    }`}
                  data-testid={`button-step-${step.id}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isComplete
                      ? "bg-emerald-100 dark:bg-emerald-900"
                      : "bg-muted"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isComplete ? "line-through opacity-70" : ""}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isComplete ? "text-emerald-500" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>

          {allComplete && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleDismiss}
                className="w-full bg-[#2EC5C2] hover:bg-[#2EC5C2]/90"
                data-testid="button-finish-onboarding"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Finish Setup
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
