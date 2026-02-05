import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/app-header";
import { Plus, FileText, Eye, Edit, Send, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Proposal } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> = {
  draft: { label: "Draft", variant: "secondary", icon: Edit },
  pending: { label: "Pending", variant: "outline", icon: Clock },
  sent: { label: "Sent", variant: "default", icon: Send },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "secondary", icon: AlertCircle },
};

export default function Proposals() {
  const { toast } = useToast();
  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });

  const sendProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return await apiRequest<any>("POST", `/api/proposals/${proposalId}/send`);
    },
    onSuccess: () => {
      toast({
        title: "Proposal Sent!",
        description: "The proposal has been sent to the client via email.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to send proposal. Please check that email is configured.";
      toast({
        title: "Send Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { label: status, variant: "secondary" as const, icon: FileText };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and track your business proposals
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/create-proposal">
              <Button variant="outline" data-testid="button-create-proposal">
                <FileText className="h-4 w-4 mr-2" />
                Custom Proposal
              </Button>
            </Link>
            <Link href="/instant-proposal">
              <Button data-testid="button-instant-proposal">
                <Plus className="h-4 w-4 mr-2" />
                Instant Proposal
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No proposals yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first proposal to start winning new business. Use our templates for quick creation or build a custom proposal.
              </p>
              <div className="flex gap-3">
                <Link href="/instant-proposal">
                  <Button data-testid="button-create-first-proposal">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Proposal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {proposals.map((proposal) => {
              const config = getStatusConfig(proposal.status);
              const StatusIcon = config.icon;
              return (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow" data-testid={`card-proposal-${proposal.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{proposal.title}</h3>
                          <Badge variant={config.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium text-gray-700">Client:</span>{" "}
                            {proposal.clientName || "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Value:</span>{" "}
                            {proposal.totalAmount ? `$${proposal.totalAmount.toLocaleString()}` : "Not set"}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>{" "}
                            {proposal.createdAt ? format(new Date(proposal.createdAt), "MMM d, yyyy") : "N/A"}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Expires:</span>{" "}
                            {proposal.expiresAt ? format(new Date(proposal.expiresAt), "MMM d, yyyy") : "No expiry"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {(proposal.status === 'draft' || proposal.status === 'pending') && proposal.clientEmail && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              sendProposalMutation.mutate(proposal.id);
                            }}
                            disabled={sendProposalMutation.isPending}
                            data-testid={`button-send-proposal-${proposal.id}`}
                          >
                            {sendProposalMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Send
                          </Button>
                        )}
                        <Link href={`/edit-proposal/${proposal.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-edit-proposal-${proposal.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/proposal/${proposal.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-proposal-${proposal.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
            <CardDescription>Get the most out of your proposals</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Use <strong>Instant Proposal</strong> for quick, template-based proposals
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Use <strong>Custom Proposal</strong> for detailed, personalized proposals
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Set expiration dates to create urgency and track follow-ups
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
