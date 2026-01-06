import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Shield, Building2, Key, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { GigsterLogo } from "@/components/vsuite-logo";

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  displayName: string;
  enabled: boolean;
}

export default function Login() {
  const { toast } = useToast();

  // Fetch available SSO providers
  const { data: ssoProviders, isLoading: isLoadingProviders } = useQuery<SSOProvider[]>({
    queryKey: ["/api/sso/providers/active"],
  });

  const handleSSOLogin = (providerId: string) => {
    // Redirect to SSO login endpoint
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
          <div className="space-y-4">
            {isLoadingProviders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : ssoProviders && ssoProviders.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">
                  Sign in with your organization's identity provider
                </p>
                {ssoProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-12"
                    onClick={() => handleSSOLogin(provider.id)}
                    data-testid={`button-sso-${provider.id}`}
                  >
                    {getProviderIcon(provider.type)}
                    <span>Sign in with {provider.displayName || provider.name}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="flex justify-center">
                  <Shield className="h-12 w-12 text-gray-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 font-medium">
                    No SSO providers configured
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact your administrator to set up Single Sign-On for your organization.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield size={14} />
                <span>Secured with enterprise SSO</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
