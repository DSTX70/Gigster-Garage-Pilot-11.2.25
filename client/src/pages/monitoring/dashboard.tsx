import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Loader2,
  XCircle,
  Download,
  Route,
  Copy,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface SLOMetrics {
  errorRate: number;
  queueAge: number;
  rateLimitSaturation: Array<{ platform: string; pct: number }>;
}

interface QueueStats {
  total: number;
  queued: number;
  posting: number;
  posted: number;
  failed: number;
  paused: number;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  lastCheck: string;
}

interface RouteMetric {
  route: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  latency: {
    p50: number;
    p95: number;
    average: number;
  };
}

interface RouteMetricsResponse {
  timestamp: string;
  timeWindow: string;
  routes: RouteMetric[];
  summary: {
    totalRoutes: number;
    topSlowRoutes: string[];
    topErrorRoutes: string[];
  };
}

export default function MonitoringDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [routeSort, setRouteSort] = useState<'requests' | 'p95' | 'errorRate'>('requests');
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const { data: sloMetrics, isLoading: sloLoading } = useQuery<SLOMetrics>({
    queryKey: ["/api/ops/metrics/slo"],
    refetchInterval: refreshInterval,
  });

  const { data: queueStats, isLoading: queueLoading } = useQuery<QueueStats>({
    queryKey: ["/api/ops/social-queue/stats"],
    refetchInterval: refreshInterval,
  });

  const { data: systemHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/ops/health"],
    refetchInterval: refreshInterval,
  });

  const { data: routeMetrics, isLoading: routeMetricsLoading } = useQuery<RouteMetricsResponse>({
    queryKey: ["/api/admin/route-metrics", { sort: routeSort }],
    refetchInterval: refreshInterval,
  });

  const handleDownloadBundle = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/admin/support-bundle', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to download bundle');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `support-bundle-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Support bundle downloaded" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to download support bundle" });
    } finally {
      setIsDownloading(false);
    }
  };

  const copyRouteToClipboard = async (route: RouteMetric) => {
    const text = `Route: ${route.route}\nRequests: ${route.requestCount}\nErrors: ${route.errorCount} (${route.errorRate.toFixed(2)}%)\nLatency p50: ${route.latency.p50}ms, p95: ${route.latency.p95}ms`;
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Route summary copied to clipboard" });
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 dark:text-green-500";
      case "degraded":
        return "text-yellow-600 dark:text-yellow-500";
      case "critical":
        return "text-red-600 dark:text-red-500";
      default:
        return "text-gray-600 dark:text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600 dark:text-gray-500" />;
    }
  };

  const getSLOStatus = (metric: string, value: number) => {
    if (metric === "errorRate" && value > 5) return "critical";
    if (metric === "queueAge" && value > 30) return "critical";
    if (metric === "errorRate" && value > 2) return "degraded";
    if (metric === "queueAge" && value > 15) return "degraded";
    return "healthy";
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const rateLimitData = (sloMetrics?.rateLimitSaturation || []).map(({ platform, pct }) => ({
    name: platform.toUpperCase(),
    usage: pct || 0,
    available: 100 - (pct || 0),
  }));

  const queueDistribution = [
    { name: "Queued", value: queueStats?.queued || 0, fill: "#3b82f6" },
    { name: "Posting", value: queueStats?.posting || 0, fill: "#f59e0b" },
    { name: "Posted", value: queueStats?.posted || 0, fill: "#10b981" },
    { name: "Failed", value: queueStats?.failed || 0, fill: "#ef4444" },
    { name: "Paused", value: queueStats?.paused || 0, fill: "#6b7280" },
  ];

  if (sloLoading || queueLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sloMetrics || !queueStats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Dashboard</CardTitle>
            <CardDescription>Unable to load metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p>Metrics are currently unavailable. The system may be starting up or experiencing issues.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time metrics and service health</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadBundle}
            disabled={isDownloading}
            data-testid="button-download-bundle"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Support Bundle
          </Button>
          {systemHealth && (
            <div className="flex items-center gap-3">
              {getStatusIcon(systemHealth.status)}
              <div>
                <p className={`font-semibold ${getHealthColor(systemHealth.status)}`}>
                  {systemHealth.status.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(systemHealth.uptime)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="card-error-rate">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Error Rate (Hourly)
              <Badge variant={getSLOStatus("errorRate", sloMetrics?.errorRate || 0) === "healthy" ? "default" : "destructive"}>
                SLO
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(sloMetrics?.errorRate ?? 0).toFixed(2)}%
            </div>
            <Progress
              value={Math.min((sloMetrics?.errorRate ?? 0) * 20, 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Threshold: 5% • Status: {getSLOStatus("errorRate", sloMetrics?.errorRate ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-queue-age">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Max Queue Age
              <Badge variant={getSLOStatus("queueAge", sloMetrics?.queueAge || 0) === "healthy" ? "default" : "destructive"}>
                SLO
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-2">
              {(sloMetrics?.queueAge ?? 0).toFixed(1)}
              <span className="text-lg text-muted-foreground">min</span>
            </div>
            <Progress
              value={Math.min((sloMetrics?.queueAge ?? 0) / 30 * 100, 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Threshold: 30 min • Status: {getSLOStatus("queueAge", sloMetrics?.queueAge ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-queue-total">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Queue Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queueStats?.total || 0}</div>
            <div className="flex gap-3 mt-3 text-xs">
              <span className="text-green-600 dark:text-green-500">✓ {queueStats?.posted || 0}</span>
              <span className="text-blue-600 dark:text-blue-500">⟳ {queueStats?.queued || 0}</span>
              <span className="text-red-600 dark:text-red-500">✗ {queueStats?.failed || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes" data-testid="tab-routes">
            <Route className="h-4 w-4 mr-2" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="rate-limits" data-testid="tab-rate-limits">
            <Zap className="h-4 w-4 mr-2" />
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="queue" data-testid="tab-queue">
            <Clock className="h-4 w-4 mr-2" />
            Queue Status
          </TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route-Level Metrics</CardTitle>
              <CardDescription>
                p50/p95 latency and error rates by endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
                {(['requests', 'p95', 'errorRate'] as const).map((sort) => (
                  <Badge
                    key={sort}
                    variant={routeSort === sort ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setRouteSort(sort)}
                    data-testid={`badge-sort-${sort}`}
                  >
                    {sort === 'requests' ? 'Request Count' : sort === 'p95' ? 'p95 Latency' : 'Error Rate'}
                  </Badge>
                ))}
              </div>
              {routeMetricsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : routeMetrics?.routes?.length ? (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead className="text-right">Error Rate</TableHead>
                        <TableHead className="text-right">p50</TableHead>
                        <TableHead className="text-right">p95</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routeMetrics.routes.slice(0, 20).map((route, idx) => (
                        <TableRow key={idx} data-testid={`row-route-${idx}`}>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate" title={route.route}>
                            {route.route}
                          </TableCell>
                          <TableCell className="text-right">{route.requestCount}</TableCell>
                          <TableCell className="text-right">
                            <span className={route.errorCount > 0 ? "text-red-600" : ""}>
                              {route.errorCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={route.errorRate > 5 ? "destructive" : route.errorRate > 1 ? "secondary" : "outline"}>
                              {route.errorRate.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{route.latency.p50}ms</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            <span className={route.latency.p95 > 1000 ? "text-yellow-600 font-medium" : ""}>
                              {route.latency.p95}ms
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyRouteToClipboard(route)}
                              data-testid={`button-copy-route-${idx}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No route metrics available yet</p>
                  <p className="text-xs mt-1">Metrics will appear as requests are made</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Saturation by Platform</CardTitle>
              <CardDescription>
                Current usage across all platforms (Alert threshold: 90%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rateLimitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage" fill="#3b82f6" name="Used %" />
                  <Bar dataKey="available" fill="#e5e7eb" name="Available %" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {(sloMetrics?.rateLimitSaturation || []).map(({ platform, pct }) => (
                  <div key={platform} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium mb-1">{platform.toUpperCase()}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{pct ?? 0}%</span>
                      {pct > 90 && <Badge variant="destructive">High</Badge>}
                      {pct > 70 && pct <= 90 && <Badge variant="secondary">Medium</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Distribution</CardTitle>
              <CardDescription>Breakdown of posts by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={queueDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                {queueDistribution.map((item) => (
                  <div key={item.name} className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{item.name}</p>
                    <p className="text-2xl font-bold" style={{ color: item.fill }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>Coming soon - 24h performance trends</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Historical trend data will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Auto-refresh Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[10, 30, 60].map((seconds) => (
              <Badge
                key={seconds}
                variant={refreshInterval === seconds * 1000 ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setRefreshInterval(seconds * 1000)}
                data-testid={`badge-refresh-${seconds}`}
              >
                {seconds}s
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
