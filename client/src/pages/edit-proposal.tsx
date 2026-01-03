import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { Link, useParams } from "wouter";
import { ArrowLeft, FileText, Plus, X, Send, Download, Eye, Save, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { Project, Proposal } from "@shared/schema";

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function EditProposal() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isPreview, setIsPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    clientName: "",
    clientEmail: "",
    projectDescription: "",
    totalBudget: 0,
    timeline: "",
    deliverables: "",
    terms: "",
    expiresInDays: 30,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const { data: proposal, isLoading: proposalLoading } = useQuery<Proposal>({
    queryKey: ["/api/proposals", id],
    queryFn: () => apiRequest("GET", `/api/proposals/${id}`),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal.title || "",
        projectId: proposal.projectId || "",
        clientName: proposal.clientName || "",
        clientEmail: proposal.clientEmail || "",
        projectDescription: proposal.projectDescription || "",
        totalBudget: Number(proposal.totalBudget) || 0,
        timeline: proposal.timeline || "",
        deliverables: proposal.deliverables || "",
        terms: proposal.terms || "",
        expiresInDays: proposal.expiresInDays || 30,
      });
      if (proposal.lineItems && Array.isArray(proposal.lineItems) && proposal.lineItems.length > 0) {
        setLineItems(proposal.lineItems.map((item: any, index: number) => ({
          id: index + 1,
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        })));
      }
    }
  }, [proposal]);

  const updateProposalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/proposals/${id}`, data),
    onSuccess: () => {
      toast({
        title: t('proposalUpdated') || "Proposal updated",
        description: t('proposalUpdatedDesc') || "Your proposal has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdateProposal') || "Failed to update proposal.",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [lineItems]);

  const handleLineItemChange = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = Math.max(...lineItems.map(item => item.id), 0) + 1;
    setLineItems(prev => [...prev, { id: newId, description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = () => {
    const proposalData = {
      title: formData.title,
      projectId: formData.projectId || undefined,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      projectDescription: formData.projectDescription,
      timeline: formData.timeline,
      deliverables: formData.deliverables,
      terms: formData.terms,
      expiresInDays: formData.expiresInDays,
      lineItems: lineItems.map(item => ({
        description: item.description,
        unitLabel: "Hours",
        unitQuantity: "1",
        amountType: "fixed",
        quantity: String(item.quantity),
        rate: String(item.rate),
        amount: String(item.amount),
      })),
      calculatedTotal: String(calculateTotal),
    };
    updateProposalMutation.mutate(proposalData);
  };

  if (proposalLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('proposalNotFound') || "Proposal not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/filing-cabinet">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">{t('editProposal') || "Edit Proposal"}</h1>
          </div>
          <Badge variant="secondary">{proposal.status}</Badge>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('proposalDetails') || "Proposal Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t('proposalTitle') || "Proposal Title"}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter proposal title"
                    data-testid="input-proposal-title"
                  />
                </div>
                <div>
                  <Label htmlFor="project">{t('project')}</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger data-testid="select-project">
                      <SelectValue placeholder={t('selectProject') || "Select project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">{t('clientName')}</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Client name"
                    data-testid="input-client-name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">{t('clientEmail')}</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="client@example.com"
                    data-testid="input-client-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="projectDescription">{t('projectDescription') || "Project Description"}</Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  placeholder="Describe the project..."
                  rows={4}
                  data-testid="textarea-project-description"
                />
              </div>

              <div>
                <Label htmlFor="deliverables">{t('deliverables')}</Label>
                <Textarea
                  id="deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  placeholder="List deliverables..."
                  rows={3}
                  data-testid="textarea-deliverables"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeline">{t('timeline')}</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g., 4 weeks"
                    data-testid="input-timeline"
                  />
                </div>
                <div>
                  <Label htmlFor="expiresInDays">{t('expiresIn') || "Expires In (days)"}</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    value={formData.expiresInDays}
                    onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 30 })}
                    data-testid="input-expires-in"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="terms">{t('terms')}</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Terms and conditions..."
                  rows={3}
                  data-testid="textarea-terms"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('lineItems') || "Line Items"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>{t('description')}</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                        placeholder="Service description"
                        data-testid={`input-line-item-desc-${item.id}`}
                      />
                    </div>
                    <div className="w-24">
                      <Label>{t('quantity') || "Qty"}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        data-testid={`input-line-item-qty-${item.id}`}
                      />
                    </div>
                    <div className="w-32">
                      <Label>{t('rate')}</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        data-testid={`input-line-item-rate-${item.id}`}
                      />
                    </div>
                    <div className="w-32">
                      <Label>{t('amount')}</Label>
                      <Input
                        value={`$${item.amount.toFixed(2)}`}
                        disabled
                        data-testid={`input-line-item-amount-${item.id}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      data-testid={`button-remove-line-item-${item.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addLineItem} data-testid="button-add-line-item">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addLineItem') || "Add Line Item"}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('total')}</p>
                  <p className="text-2xl font-bold">${calculateTotal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/filing-cabinet">
              <Button variant="outline" data-testid="button-cancel">
                {t('cancel')}
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={updateProposalMutation.isPending}
              data-testid="button-save-proposal"
            >
              {updateProposalMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('saveProposal')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
