import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { LogIn, Shield, Building2, Key, Loader2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GigsterLogo } from "@/components/vsuite-logo";
import { Separator } from "@/components/ui/separator";

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  displayName: string;
  enabled: boolean;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check for session expired flag
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setSessionExpired(true);
      // Clean up URL (remove expired param but keep next)
      const next = params.get('next');
      const newUrl = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  
  // Get redirect target from query params (for mobile auth flow)
  const getRedirectTarget = (): string => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    return next && next.startsWith('/') ? decodeURIComponent(next) : '/';
  };

  // Fetch available SSO providers
  const { data: ssoProviders, isLoading: isLoadingProviders } = useQuery<SSOProvider[]>({
    queryKey: ["/api/sso/providers/active"],
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest<any>("POST", "/api/login", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "Welcome to Gigster Garage",
      });
      const redirectTo = getRedirectTarget();
      setTimeout(() => {
        setLocation(redirectTo);
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  const handleSSOLogin = (providerId: string) => {
    window.location.href = `/sso/${providerId}/login`;
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'saml':
        return <Shield size={18} />;
      case 'oauth2':
        return <Key size={18} />;
      default:
        return <Building2 size={18} />;
    }
  };

  const hasSSOProviders = ssoProviders && ssoProviders.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(11, 29, 58, 0.05) 0%, rgba(46, 197, 194, 0.05) 100%)' }}>
      <Card className="gigster-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <GigsterLogo size="medium" showText={false} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl brand-heading">Gigster Garage</CardTitle>
            <p className="text-xs brand-tagline">Smarter tools for bolder dreams</p>
            <p className="text-gray-600 pt-2">Sign in to your account</p>
          </div>
        </CardHeader>
        <CardContent>
          {sessionExpired && (
            <Alert variant="destructive" className="mb-4" data-testid="alert-session-expired">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your session has expired. Please sign in again to continue.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
                data-testid="input-username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
                data-testid="input-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="gigster-button-primary w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* SSO Providers Section */}
          {isLoadingProviders ? (
            <div className="flex justify-center py-4 mt-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : hasSSOProviders ? (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {ssoProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleSSOLogin(provider.id)}
                    data-testid={`button-sso-${provider.id}`}
                  >
                    {getProviderIcon(provider.type)}
                    <span>Sign in with {provider.displayName || provider.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          
          <div className="mt-6 text-center text-sm text-gray-600 space-y-3">
            <p>
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Create one here
              </Link>
            </p>
            
            <div className="border-t pt-3">
              <p>Demo Account:</p>
              <p>Username: <code className="bg-gray-100 px-1 rounded">demo</code></p>
              <p>Password: <code className="bg-gray-100 px-1 rounded">demo123</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
