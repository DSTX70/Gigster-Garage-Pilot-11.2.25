import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationStatus, type IntegrationInfo } from "@/hooks/useIntegrationStatus";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Mail,
  MessageSquare,
  CreditCard,
  Brain,
  Database,
  HardDrive,
  MessageCircle,
  Send,
} from "lucide-react";
import { SiX, SiInstagram, SiLinkedin } from "react-icons/si";

interface IntegrationCardProps {
  name: string;
  icon: React.ReactNode;
  info: IntegrationInfo;
  testAction?: {
    label: string;
    inputLabel?: string;
    inputPlaceholder?: string;
    onTest: (value?: string) => void;
    isPending: boolean;
  };
  setupInstructions?: React.ReactNode;
}

function IntegrationCard({ name, icon, info, testAction, setupInstructions }: IntegrationCardProps) {
  const [testInput, setTestInput] = useState("");
  const [isOpen, setIsOpen] = useState(!info.configured);

  return (
    <Card className={info.configured ? "border-green-200 dark:border-green-900" : "border-amber-200 dark:border-amber-900"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.configured ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs">
                {info.enables.slice(0, 2).join(", ")}
              </CardDescription>
            </div>
          </div>
          <Badge variant={info.configured ? "default" : "secondary"} className={info.configured ? "bg-green-600" : ""}>
            {info.configured ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Not Configured</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {info.configured && testAction && (
          <div className="flex gap-2 mb-3">
            {testAction.inputLabel && (
              <Input
                placeholder={testAction.inputPlaceholder}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="flex-1"
                data-testid={`input-test-${name.toLowerCase().replace(/\s/g, "-")}`}
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => testAction.onTest(testInput)}
              disabled={testAction.isPending}
              data-testid={`button-test-${name.toLowerCase().replace(/\s/g, "-")}`}
            >
              {testAction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Send className="h-4 w-4 mr-1" /> {testAction.label}</>
              )}
            </Button>
          </div>
        )}

        {!info.configured && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                How to connect
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="text-sm text-muted-foreground space-y-2 bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Missing secrets:</p>
                <ul className="list-disc list-inside space-y-1">
                  {info.missingSecrets.map((secret) => (
                    <li key={secret} className="font-mono text-xs">{secret}</li>
                  ))}
                </ul>
                {setupInstructions}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationDashboard() {
  const { toast } = useToast();
  const { integrations, isLoading, refetch } = useIntegrationStatus();

  const testEmailMutation = useMutation({
    mutationFn: async (email?: string) => {
      return await apiRequest("POST", "/api/notifications/test-email", { email });
    },
    onSuccess: (data: any) => {
      toast({ title: "Test email sent!", description: data.message });
    },
    onError: (error: any) => {
      toast({ 
        title: "Email test failed", 
        description: error.message || "Check configuration",
        variant: "destructive" 
      });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return await apiRequest("POST", "/api/notifications/test-sms", { phoneNumber });
    },
    onSuccess: (data: any) => {
      toast({ title: "Test SMS sent!", description: data.message });
    },
    onError: (error: any) => {
      toast({ 
        title: "SMS test failed", 
        description: error.message || "Check configuration",
        variant: "destructive" 
      });
    },
  });

  if (isLoading || !integrations) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Integration Status</h2>
          <p className="text-sm text-muted-foreground">Configure integrations to unlock features</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-integrations">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <IntegrationCard
          name="Email (SendGrid)"
          icon={<Mail className="h-5 w-5 text-blue-600" />}
          info={integrations.email}
          testAction={{
            label: "Send Test",
            inputLabel: "Email",
            inputPlaceholder: "your@email.com",
            onTest: (email) => { testEmailMutation.mutate(email); },
            isPending: testEmailMutation.isPending,
          }}
          setupInstructions={
            <p className="mt-2">
              Get your API key from{" "}
              <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                SendGrid
              </a>
              {" "}and add it to your secrets.
            </p>
          }
        />

        <IntegrationCard
          name="SMS (Twilio)"
          icon={<MessageSquare className="h-5 w-5 text-red-600" />}
          info={integrations.sms}
          testAction={{
            label: "Send Test",
            inputLabel: "Phone",
            inputPlaceholder: "+1234567890",
            onTest: (phone) => { testSmsMutation.mutate(phone || ""); },
            isPending: testSmsMutation.isPending,
          }}
          setupInstructions={
            <p className="mt-2">
              Get credentials from{" "}
              <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Twilio Console
              </a>
            </p>
          }
        />

        <IntegrationCard
          name="Payments (Stripe)"
          icon={<CreditCard className="h-5 w-5 text-purple-600" />}
          info={integrations.stripe}
          setupInstructions={
            <p className="mt-2">
              Get your secret key from{" "}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Stripe Dashboard
              </a>
            </p>
          }
        />

        <IntegrationCard
          name="AI (OpenAI)"
          icon={<Brain className="h-5 w-5 text-emerald-600" />}
          info={integrations.ai}
          setupInstructions={
            <p className="mt-2">
              Get your API key from{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                OpenAI Platform
              </a>
            </p>
          }
        />

        <IntegrationCard
          name="Database"
          icon={<Database className="h-5 w-5 text-slate-600" />}
          info={integrations.database}
        />

        <IntegrationCard
          name="Object Storage"
          icon={<HardDrive className="h-5 w-5 text-orange-600" />}
          info={integrations.objectStorage}
        />

        <IntegrationCard
          name="Slack"
          icon={<MessageCircle className="h-5 w-5 text-pink-600" />}
          info={integrations.slack}
          setupInstructions={
            <p className="mt-2">
              Create a Slack app at{" "}
              <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Slack API
              </a>
            </p>
          }
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Social Media Connections</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <IntegrationCard
            name="X (Twitter)"
            icon={<SiX className="h-5 w-5" />}
            info={integrations.social.x}
            setupInstructions={
              <p className="mt-2">
                Get API credentials from{" "}
                <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Twitter Developer Portal
                </a>
              </p>
            }
          />

          <IntegrationCard
            name="Instagram"
            icon={<SiInstagram className="h-5 w-5 text-pink-500" />}
            info={integrations.social.instagram}
            setupInstructions={
              <p className="mt-2">
                Set up via{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Meta Developer Portal
                </a>
              </p>
            }
          />

          <IntegrationCard
            name="LinkedIn"
            icon={<SiLinkedin className="h-5 w-5 text-blue-700" />}
            info={integrations.social.linkedin}
            setupInstructions={
              <p className="mt-2">
                Get credentials from{" "}
                <a href="https://www.linkedin.com/developers" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  LinkedIn Developers
                </a>
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
