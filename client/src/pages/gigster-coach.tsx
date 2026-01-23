import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { GigsterCoachContext } from "../../../shared/contracts/gigsterCoach";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, FileText, CheckCircle2, Lightbulb, History, Send, User, Volume2, VolumeX, Pause, Play, Paperclip, X } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { getCoachContext } from "@/lib/getCoachContext";
import { Link } from "wouter";

function PersonalizationBadge({ ctx }: { ctx: GigsterCoachContext | null }) {
  if (!ctx) return null;
  
  const parts: string[] = [];
  if (ctx.business?.businessStage) parts.push(ctx.business.businessStage.replace(/\s*→.*/, "").trim());
  if (ctx.business?.industry) parts.push(ctx.business.industry.replace(/\s*\(.*\)/, "").trim());
  if (ctx.user?.role) parts.push(ctx.user.role);
  
  if (parts.length === 0) return null;
  
  const label = parts.slice(0, 2).join(" • ");
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5" data-testid="badge-personalization">
      <User className="h-3 w-3" />
      <span>{label}</span>
      <Link href="/settings/profile" className="text-primary hover:underline ml-1">
        Edit
      </Link>
    </div>
  );
}

type CoachResponse = {
  answer: string;
  suggestions?: any[];
  checklist?: any[];
  interactionId?: string;
  model?: string;
  tokensUsed?: number;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  intent: string;
  question: string;
  answer: string;
  model?: string;
  tokensUsed?: number;
};

export default function GigsterCoachPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [activeTab, setActiveTab] = useState("ask");
  const [profileCtx, setProfileCtx] = useState<GigsterCoachContext | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({ name: file.name, content, type: file.type });
      toast({ title: "File attached", description: `${file.name} ready to send` });
    };
    reader.onerror = () => {
      toast({ title: "Error", description: "Failed to read file", variant: "destructive" });
    };
    
    if (file.type.startsWith("text/") || file.type === "application/json" || file.name.endsWith(".md")) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  useEffect(() => {
    getCoachContext().then((ctx) => setProfileCtx(ctx ?? null));
  }, []);

  const { data: history, isLoading: historyLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/gigster-coach/history"],
    enabled: isAuthenticated,
  });

  const askMutation = useMutation({
    mutationFn: async (data: { question: string; attachment?: { name: string; content: string; type: string } }) => {
      const coachContext = await getCoachContext();
      const res = await apiRequest<CoachResponse>("POST", "/api/gigster-coach/ask", { ...data, coachContext });
      return res;
    },
    onSuccess: (data) => {
      setResponse(data);
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/gigster-coach/history"] });
      toast({ title: "Response received", description: "GigsterCoach has answered your question." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to get response", variant: "destructive" });
    },
  });

  const draftMutation = useMutation({
    mutationFn: async (data: { question: string; draftTarget?: string; attachment?: { name: string; content: string; type: string } }) => {
      const coachContext = await getCoachContext();
      const res = await apiRequest<CoachResponse>("POST", "/api/gigster-coach/draft", { ...data, coachContext });
      return res;
    },
    onSuccess: (data) => {
      setResponse(data);
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/gigster-coach/history"] });
      toast({ title: "Draft generated", description: "GigsterCoach has drafted content for you." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to generate draft", variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { question: string; artifactText?: string; attachment?: { name: string; content: string; type: string } }) => {
      const coachContext = await getCoachContext();
      const res = await apiRequest<CoachResponse>("POST", "/api/gigster-coach/review", { ...data, coachContext });
      return res;
    },
    onSuccess: (data) => {
      setResponse(data);
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/gigster-coach/history"] });
      toast({ title: "Review complete", description: "GigsterCoach has reviewed your content." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to review", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!question.trim()) return;
    
    const payload = { question, attachment: attachedFile || undefined };
    
    if (activeTab === "ask") {
      askMutation.mutate(payload);
    } else if (activeTab === "draft") {
      draftMutation.mutate(payload);
    } else if (activeTab === "review") {
      reviewMutation.mutate(payload);
    }
  };

  const isLoading = askMutation.isPending || draftMutation.isPending || reviewMutation.isPending;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to use GigsterCoach.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#004C6D] flex items-center gap-3" data-testid="heading-gigster-coach">
          <Lightbulb className="h-8 w-8" />
          GigsterCoach
        </h1>
        <p className="text-muted-foreground mt-2">
          Your AI business coach - get help with proposals, invoices, contracts, and general business questions.
        </p>
        <div className="mt-3">
          <PersonalizationBadge ctx={profileCtx} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask GigsterCoach</CardTitle>
              <CardDescription>Choose a mode and ask your question</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="ask" className="flex items-center gap-2" data-testid="tab-ask">
                    <MessageSquare className="h-4 w-4" />
                    Ask
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="flex items-center gap-2" data-testid="tab-draft">
                    <FileText className="h-4 w-4" />
                    Draft
                  </TabsTrigger>
                  <TabsTrigger value="review" className="flex items-center gap-2" data-testid="tab-review">
                    <CheckCircle2 className="h-4 w-4" />
                    Review
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ask">
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask any business question - pricing, client communication, scope management, etc.
                  </p>
                </TabsContent>
                <TabsContent value="draft">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate drafts for proposals, invoice terms, contracts, and client messages.
                  </p>
                </TabsContent>
                <TabsContent value="review">
                  <p className="text-sm text-muted-foreground mb-4">
                    Get a review and checklist for your proposals, contracts, or invoices.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    placeholder={
                      activeTab === "ask" 
                        ? "How should I handle a client who wants unlimited revisions?" 
                        : activeTab === "draft"
                        ? "Draft professional invoice payment terms for a 30-day net"
                        : "Review this proposal scope for completeness..."
                    }
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[120px] mt-2"
                    data-testid="input-question"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="coach-file-upload"
                    className="hidden"
                    accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('coach-file-upload')?.click()}
                    className="flex items-center gap-2"
                    data-testid="button-attach-file"
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach File
                  </Button>
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="hover:text-red-500"
                        data-testid="button-remove-file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading || !question.trim()}
                  className="w-full bg-[#004C6D] hover:bg-[#003d59]"
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Response
                  {response.model && (
                    <Badge variant="outline" className="text-xs">
                      {response.model}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none" data-testid="text-response">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                    {response.answer}
                  </pre>
                </div>

                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Volume2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700 font-medium">Text-to-Speech:</span>
                  {isSpeaking ? (
                    <>
                      {isPaused ? (
                        <Button
                          size="sm"
                          onClick={() => resume()}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-resume-speech"
                        >
                          <Play className="h-4 w-4" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => pause()}
                          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                          data-testid="button-pause-speech"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stop()}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200"
                        data-testid="button-stop-speech"
                      >
                        <VolumeX className="h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => speak(response.answer)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-speak-response"
                    >
                      <Volume2 className="h-4 w-4" />
                      Listen to Answer
                    </Button>
                  )}
                </div>

                {response.checklist && response.checklist.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Checklist</h4>
                    <div className="space-y-2">
                      {response.checklist.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.suggestions && response.suggestions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Suggestions</h4>
                    <div className="space-y-2">
                      {response.suggestions.map((s: any) => (
                        <div key={s.id} className="p-3 border rounded-lg">
                          <div className="font-medium">{s.title}</div>
                          {s.reason && <p className="text-sm text-muted-foreground mt-1">{s.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.tokensUsed && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Tokens used: {response.tokensUsed}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history && history.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {history.slice(0, 20).map((item) => {
                      const safeQuestion = typeof item.question === 'string' 
                        ? item.question.replace(/<[^>]*>/g, '').substring(0, 200) 
                        : 'Question';
                      const safeAnswer = typeof item.answer === 'string'
                        ? item.answer.replace(/<[^>]*>/g, '').substring(0, 500)
                        : '';
                      return (
                        <div
                          key={item.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setQuestion(item.question);
                            setResponse({ answer: safeAnswer, model: item.model, tokensUsed: item.tokensUsed });
                          }}
                          data-testid={`history-item-${item.id}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {item.intent}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{safeQuestion}</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet. Ask your first question!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <strong>Ask Mode:</strong> General questions about running your business
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <strong>Draft Mode:</strong> Generate professional content for documents
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <strong>Review Mode:</strong> Get feedback and checklists for your work
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
