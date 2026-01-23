import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Activity, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Server,
  Database,
  FileCode,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import type { DthRegistry, DthSyncLog, DthAccessLog } from "@shared/schema";

type DthStats = {
  totalRegistries: number;
  activeRegistries: number;
  healthyRegistries: number;
  totalSyncs: number;
  recentSyncs: number;
  totalFilesAccessed: number;
  accessStats: { allowed: number; blocked: number; errors: number };
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    active: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
    inactive: { variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
    pending: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
    error: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
    healthy: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
    degraded: { variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
    unhealthy: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    unknown: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  };
  
  const config = variants[status] || variants.unknown;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {status}
    </Badge>
  );
}

function CreateRegistryDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hubUrl: "",
    connectionType: "readonly" as const,
    syncFrequency: "manual" as const,
    status: "pending" as const,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/dth/registry", data);
    },
    onSuccess: () => {
      toast({ title: "Registry created", description: "The DTH registry has been created successfully." });
      setOpen(false);
      setFormData({ name: "", description: "", hubUrl: "", connectionType: "readonly", syncFrequency: "manual", status: "pending" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create registry", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-create-registry">
          <Plus className="h-4 w-4 mr-2" />
          Add Registry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create DTH Registry</DialogTitle>
          <DialogDescription>
            Register a new DreamTeamHub connection for file synchronization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Production Hub"
              data-testid="input-registry-name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hubUrl">Hub URL</Label>
            <Input
              id="hubUrl"
              value={formData.hubUrl}
              onChange={(e) => setFormData({ ...formData, hubUrl: e.target.value })}
              placeholder="https://hub.dreamteam.example.com"
              data-testid="input-registry-url"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Main production hub for code synchronization"
              data-testid="input-registry-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <Select
                value={formData.connectionType}
                onValueChange={(v: any) => setFormData({ ...formData, connectionType: v })}
              >
                <SelectTrigger data-testid="select-connection-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">Read Only</SelectItem>
                  <SelectItem value="readwrite">Read/Write</SelectItem>
                  <SelectItem value="sync">Full Sync</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="syncFrequency">Sync Frequency</Label>
              <Select
                value={formData.syncFrequency}
                onValueChange={(v: any) => setFormData({ ...formData, syncFrequency: v })}
              >
                <SelectTrigger data-testid="select-sync-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || !formData.hubUrl || createMutation.isPending}
            data-testid="btn-submit-registry"
          >
            {createMutation.isPending ? "Creating..." : "Create Registry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegistryCard({ 
  registry, 
  onHealthCheck, 
  onDelete,
  onEdit,
  isChecking 
}: { 
  registry: DthRegistry; 
  onHealthCheck: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (registry: DthRegistry) => void;
  isChecking: boolean;
}) {
  return (
    <Card data-testid={`registry-card-${registry.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              {registry.name}
            </CardTitle>
            <CardDescription className="mt-1">{registry.hubUrl}</CardDescription>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={registry.status} />
            <StatusBadge status={registry.healthStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{registry.description || "No description"}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Connection Type:</span>
            <span className="ml-2 font-medium">{registry.connectionType}</span>
          </div>
          <div>
            <span className="text-gray-500">Sync Frequency:</span>
            <span className="ml-2 font-medium">{registry.syncFrequency}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Sync:</span>
            <span className="ml-2">
              {registry.lastSyncAt ? format(new Date(registry.lastSyncAt), "MMM d, HH:mm") : "Never"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Last Health Check:</span>
            <span className="ml-2">
              {registry.lastHealthCheck ? format(new Date(registry.lastHealthCheck), "MMM d, HH:mm") : "Never"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHealthCheck(registry.id)}
            disabled={isChecking}
            data-testid={`btn-health-check-${registry.id}`}
          >
            <Activity className="h-4 w-4 mr-1" />
            {isChecking ? "Checking..." : "Health Check"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(registry)}
            data-testid={`btn-edit-${registry.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(registry.id)}
            data-testid={`btn-delete-${registry.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DthRegistryPage() {
  const { toast } = useToast();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [editingRegistry, setEditingRegistry] = useState<DthRegistry | null>(null);

  const { data: registries = [], isLoading: loadingRegistries, refetch: refetchRegistries } = useQuery<DthRegistry[]>({
    queryKey: ["/api/dth/registry"],
  });

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<DthStats>({
    queryKey: ["/api/dth/stats"],
  });

  const { data: syncLogs = [] } = useQuery<DthSyncLog[]>({
    queryKey: ["/api/dth/sync-logs"],
  });

  const { data: accessLogs = [] } = useQuery<DthAccessLog[]>({
    queryKey: ["/api/dth/access-logs"],
  });

  const healthCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      setCheckingId(id);
      return apiRequest("POST", `/api/dth/registry/${id}/health-check`);
    },
    onSuccess: (data: any) => {
      toast({
        title: data.healthy ? "Health check passed" : "Health check failed",
        description: data.healthy 
          ? `Latency: ${data.latencyMs}ms` 
          : data.error || "Unknown error",
        variant: data.healthy ? "default" : "destructive",
      });
      refetchRegistries();
    },
    onError: (error: any) => {
      toast({ title: "Health check failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => setCheckingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/dth/registry/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Registry deleted", description: "The DTH registry has been removed." });
      refetchRegistries();
      refetchStats();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DthRegistry> }) => {
      return apiRequest("PATCH", `/api/dth/registry/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Registry updated" });
      setEditingRegistry(null);
      refetchRegistries();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const handleRefresh = () => {
    refetchRegistries();
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ["/api/dth/sync-logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dth/access-logs"] });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-7 w-7" />
            DTH Registry
          </h1>
          <p className="text-gray-600 mt-1">
            Manage DreamTeamHub connections for secure file synchronization and access control.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} data-testid="btn-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateRegistryDialog onSuccess={handleRefresh} />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalRegistries}</p>
                  <p className="text-sm text-gray-500">Total Registries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.healthyRegistries}/{stats.activeRegistries}</p>
                  <p className="text-sm text-gray-500">Healthy/Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalFilesAccessed}</p>
                  <p className="text-sm text-gray-500">Files Accessed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recentSyncs}</p>
                  <p className="text-sm text-gray-500">Syncs (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="registries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registries">Registries</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="registries" className="space-y-4">
          {loadingRegistries ? (
            <Card>
              <CardContent className="py-10 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Loading registries...</p>
              </CardContent>
            </Card>
          ) : registries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Database className="h-12 w-12 mx-auto text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No registries yet</h3>
                <p className="text-gray-500 mt-1">Create your first DTH registry to start syncing files.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {registries.map((registry) => (
                <RegistryCard
                  key={registry.id}
                  registry={registry}
                  onHealthCheck={(id) => healthCheckMutation.mutate(id)}
                  onDelete={(id) => {
                    if (confirm("Are you sure you want to delete this registry?")) {
                      deleteMutation.mutate(id);
                    }
                  }}
                  onEdit={setEditingRegistry}
                  isChecking={checkingId === registry.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync-logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Sync Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.startedAt), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.syncType}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell>
                          {log.filesSucceeded}/{log.filesRequested}
                          {log.filesFailed > 0 && (
                            <span className="text-red-500 ml-1">({log.filesFailed} failed)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.durationMs ? `${log.durationMs}ms` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {syncLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No sync logs yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent File Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">
                          {log.normalizedPath || log.requestedPath}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.accessResult === "allowed" ? "default" : "destructive"}
                          >
                            {log.accessResult}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.fileSize ? `${(log.fileSize / 1024).toFixed(1)}KB` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {accessLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          No access logs yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingRegistry && (
        <Dialog open={!!editingRegistry} onOpenChange={() => setEditingRegistry(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Registry</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={editingRegistry.name}
                  onChange={(e) => setEditingRegistry({ ...editingRegistry, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Hub URL</Label>
                <Input
                  value={editingRegistry.hubUrl}
                  onChange={(e) => setEditingRegistry({ ...editingRegistry, hubUrl: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editingRegistry.description || ""}
                  onChange={(e) => setEditingRegistry({ ...editingRegistry, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editingRegistry.status}
                    onValueChange={(v: any) => setEditingRegistry({ ...editingRegistry, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Sync Frequency</Label>
                  <Select
                    value={editingRegistry.syncFrequency}
                    onValueChange={(v: any) => setEditingRegistry({ ...editingRegistry, syncFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRegistry(null)}>Cancel</Button>
              <Button 
                onClick={() => updateMutation.mutate({ 
                  id: editingRegistry.id, 
                  data: {
                    name: editingRegistry.name,
                    hubUrl: editingRegistry.hubUrl,
                    description: editingRegistry.description,
                    status: editingRegistry.status,
                    syncFrequency: editingRegistry.syncFrequency,
                  }
                })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
