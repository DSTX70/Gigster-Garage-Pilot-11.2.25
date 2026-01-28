import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { GigsterCoachContext, CoachingMode } from "../../../shared/contracts/gigsterCoach";
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
import { Loader2, MessageSquare, FileText, CheckCircle2, Lightbulb, History, Send, User, Volume2, VolumeX, Pause, Play, Paperclip, X, Zap, Search, ArrowRight } from "lucide-react";
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

type ClarifyingAnswer = {
  question: string;
  answer: string;
};

type CoachResponse = {
  answer: string;
  suggestions?: any[];
  checklist?: any[];
  interactionId?: string;
  model?: string;
  tokensUsed?: number;
  awaitingClarification?: boolean;
  clarifyingQuestions?: { id: string; question: string; hint?: string }[];
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
  
  // Coaching mode state - persisted in localStorage
  const [coachingMode, setCoachingMode] = useState<CoachingMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gigsterCoach_mode');
      if (stored === 'deep' || stored === 'quick') return stored;
    }
    return "quick";
  });
  const [clarifyingAnswers, setClarifyingAnswers] = useState<ClarifyingAnswer[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [originalQuestion, setOriginalQuestion] = useState("");

  // Persist coaching mode to localStorage
  useEffect(() => {
    localStorage.setItem('gigsterCoach_mode', coachingMode);
  }, [coachingMode]);

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
    mutationFn: async (data: { 
      question: string; 
      attachment?: { name: string; content: string; type: string };
      coachingMode?: CoachingMode;
      deepDivePhase?: "questions" | "answer";
      clarifyingAnswers?: ClarifyingAnswer[];
    }) => {
      const coachContext = await getCoachContext();
      const res = await apiRequest<CoachResponse>("POST", "/api/gigster-coach/ask", { ...data, coachContext });
      return res;
    },
    onSuccess: (data) => {
      setResponse(data);
      setAttachedFile(null);
      
      // If in Deep Dive mode and awaiting clarification, parse questions from the answer
      if (data.awaitingClarification && coachingMode === "deep") {
        const questionMatches = data.answer.match(/\d+\.\s*([^\n?]+\?)/g) || [];
        const extractedQuestions = questionMatches.map(q => q.replace(/^\d+\.\s*/, '').trim());
        if (extractedQuestions.length > 0) {
          setPendingQuestions(extractedQuestions);
          setClarifyingAnswers(extractedQuestions.map(q => ({ question: q, answer: '' })));
        }
      } else {
        setPendingQuestions([]);
        setClarifyingAnswers([]);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/gigster-coach/history"] });
      toast({ 
        title: data.awaitingClarification ? "Let me understand better" : "Response received", 
        description: data.awaitingClarification 
          ? "Please answer the questions below for tailored advice."
          : "GigsterCoach has answered your question." 
      });
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
    
    setOriginalQuestion(question);
    const payload = { 
      question, 
      attachment: attachedFile || undefined,
      coachingMode,
      deepDivePhase: coachingMode === "deep" ? "questions" as const : undefined,
    };
    
    if (activeTab === "ask") {
      askMutation.mutate(payload);
    } else if (activeTab === "draft") {
      draftMutation.mutate(payload);
    } else if (activeTab === "review") {
      reviewMutation.mutate(payload);
    }
  };

  const handleGoDeeper = () => {
    if (!response || !originalQuestion) {
      // Use current question if no original
      setOriginalQuestion(question);
    }
    setCoachingMode("deep");
    const questionToUse = originalQuestion || question;
    if (questionToUse.trim()) {
      askMutation.mutate({
        question: questionToUse,
        coachingMode: "deep",
        deepDivePhase: "questions",
      });
    }
  };

  const handleSubmitClarifyingAnswers = () => {
    const filledAnswers = clarifyingAnswers.filter(a => a.answer.trim());
    if (filledAnswers.length === 0) {
      toast({ title: "Please answer at least one question", variant: "destructive" });
      return;
    }
    
    askMutation.mutate({
      question: originalQuestion || question,
      coachingMode: "deep",
      deepDivePhase: "answer",
      clarifyingAnswers: filledAnswers,
    });
  };

  const handleSwitchToQuick = () => {
    setCoachingMode("quick");
    setPendingQuestions([]);
    setClarifyingAnswers([]);
    toast({ title: "Switched to Quick Answer mode" });
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
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <PersonalizationBadge ctx={profileCtx} />
          
          {/* Coaching Mode Indicator */}
          <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-full px-3 py-1.5" data-testid="badge-coaching-mode">
            {coachingMode === "quick" ? (
              <>
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-muted-foreground">Quick Answer</span>
              </>
            ) : (
              <>
                <Search className="h-3 w-3 text-blue-500" />
                <span className="text-muted-foreground">Deep Dive</span>
                <button 
                  onClick={handleSwitchToQuick}
                  className="ml-1 text-primary hover:underline"
                  data-testid="button-switch-quick"
                >
                  Switch to Quick
                </button>
              </>
            )}
          </div>
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
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Written Response (scroll to read)</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg max-h-[400px] overflow-y-auto leading-relaxed">
                    {response.answer}
                  </div>
                </div>

                {/* Clarifying Questions UI for Deep Dive */}
                {response.awaitingClarification && pendingQuestions.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200" data-testid="clarifying-questions-section">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Help me give you better advice
                    </h4>
                    <div className="space-y-4">
                      {clarifyingAnswers.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <Label className="text-sm text-blue-700 font-medium">
                            {idx + 1}. {item.question}
                          </Label>
                          <Textarea
                            value={item.answer}
                            onChange={(e) => {
                              const updated = [...clarifyingAnswers];
                              updated[idx] = { ...updated[idx], answer: e.target.value };
                              setClarifyingAnswers(updated);
                            }}
                            placeholder="Your answer..."
                            className="min-h-[60px] bg-white"
                            data-testid={`input-clarifying-${idx}`}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmitClarifyingAnswers}
                      disabled={isLoading || clarifyingAnswers.every(a => !a.answer.trim())}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                      data-testid="button-submit-clarifying"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Getting tailored advice...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Get Tailored Advice
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Go Deeper button - shows when in Quick mode and response exists */}
                {!response.awaitingClarification && coachingMode === "quick" && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <Search className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm text-indigo-700">Want more tailored advice?</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGoDeeper}
                      disabled={isLoading}
                      className="flex items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                      data-testid="button-go-deeper"
                    >
                      <Search className="h-4 w-4" />
                      Go Deeper
                    </Button>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Volume2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700 font-medium">Optional: Listen to response</span>
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
