import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { useTranslation } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Contract {
  id: string;
  contractTitle: string;
  contractType: string;
  clientName: string;
  clientEmail: string;
  contractValue: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string | null;
}

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId: string) => apiRequest("DELETE", `/api/contracts/${contractId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract deleted",
        description: "The contract has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contract.",
        variant: "destructive",
      });
    },
  });

  const filteredContracts = contracts.filter((contract) =>
    contract.contractTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.contractType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      signed: "bg-green-100 text-green-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusStyles[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-8 w-8 text-primary" />
              {t('contracts') || 'Contracts'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all your contracts and agreements
            </p>
          </div>
          <Link href="/create-contract">
            <Button className="gap-2" data-testid="button-create-contract">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-contracts"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredContracts.length} {filteredContracts.length === 1 ? 'contract' : 'contracts'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contracts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Create your first contract to get started"}
              </p>
              {!searchQuery && (
                <Link href="/create-contract">
                  <Button className="gap-2" data-testid="button-create-first-contract">
                    <Plus className="h-4 w-4" />
                    Create Contract
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow" data-testid={`card-contract-${contract.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {contract.contractTitle || "Untitled Contract"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contract.contractType || "General"}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(contract.status)}>
                      {contract.status || "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contract.clientName || "No client"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(contract.contractValue)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/edit-contract/${contract.id}`}>
                      <Button variant="outline" size="sm" className="gap-1" data-testid={`button-edit-contract-${contract.id}`}>
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(`/api/contracts/${contract.id}/pdf`, '_blank')}
                      data-testid={`button-download-contract-${contract.id}`}
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-red-600 hover:text-red-700"
                          data-testid={`button-delete-contract-${contract.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{contract.contractTitle}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-${contract.id}`}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteContractMutation.mutate(contract.id)}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid={`button-confirm-delete-${contract.id}`}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
