import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { Link, useParams } from "wouter";
import { ArrowLeft, FileSignature, Save, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { Project, Contract } from "@shared/schema";

export default function EditContract() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    contractType: "service",
    scope: "",
    terms: "",
    paymentTerms: "",
    startDate: "",
    endDate: "",
    totalValue: 0,
  });

  const { data: contract, isLoading: contractLoading } = useQuery<Contract>({
    queryKey: ["/api/contracts", id],
    queryFn: () => apiRequest("GET", `/api/contracts/${id}`),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title || "",
        projectId: contract.projectId || "",
        clientName: contract.clientName || "",
        clientEmail: contract.clientEmail || "",
        clientAddress: contract.clientAddress || "",
        contractType: contract.contractType || "service",
        scope: contract.scope || "",
        terms: contract.terms || "",
        paymentTerms: contract.paymentTerms || "",
        startDate: contract.startDate || "",
        endDate: contract.endDate || "",
        totalValue: Number(contract.totalValue) || 0,
      });
    }
  }, [contract]);

  const updateContractMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/contracts/${id}`, data),
    onSuccess: () => {
      toast({
        title: t('contractUpdated') || "Contract updated",
        description: t('contractUpdatedDesc') || "Your contract has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdateContract') || "Failed to update contract.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateContractMutation.mutate(formData);
  };

  if (contractLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('contractNotFound') || "Contract not found"}</p>
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
            <FileSignature className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">{t('editContract') || "Edit Contract"}</h1>
          </div>
          <Badge variant="secondary">{contract.status}</Badge>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('contractDetails') || "Contract Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t('contractTitle') || "Contract Title"}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter contract title"
                    data-testid="input-contract-title"
                  />
                </div>
                <div>
                  <Label htmlFor="contractType">{t('contractType') || "Contract Type"}</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) => setFormData({ ...formData, contractType: value })}
                  >
                    <SelectTrigger data-testid="select-contract-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service Agreement</SelectItem>
                      <SelectItem value="employment">Employment Contract</SelectItem>
                      <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                      <SelectItem value="partnership">Partnership Agreement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                <Label htmlFor="clientAddress">{t('clientAddress')}</Label>
                <Textarea
                  id="clientAddress"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  placeholder="Client address..."
                  rows={2}
                  data-testid="textarea-client-address"
                />
              </div>

              <div>
                <Label htmlFor="scope">{t('scope') || "Scope of Work"}</Label>
                <Textarea
                  id="scope"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="Describe the scope of work..."
                  rows={4}
                  data-testid="textarea-scope"
                />
              </div>

              <div>
                <Label htmlFor="terms">{t('terms')}</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Terms and conditions..."
                  rows={4}
                  data-testid="textarea-terms"
                />
              </div>

              <div>
                <Label htmlFor="paymentTerms">{t('paymentTerms') || "Payment Terms"}</Label>
                <Textarea
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="Payment schedule and terms..."
                  rows={3}
                  data-testid="textarea-payment-terms"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">{t('startDate') || "Start Date"}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">{t('endDate') || "End Date"}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
                <div>
                  <Label htmlFor="totalValue">{t('totalValue') || "Total Value"}</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    value={formData.totalValue}
                    onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                    data-testid="input-total-value"
                  />
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
              disabled={updateContractMutation.isPending}
              data-testid="button-save-contract"
            >
              {updateContractMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('saveContract')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
