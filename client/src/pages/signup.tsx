import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { GigsterLogo } from "@/components/vsuite-logo";
import { Separator } from "@/components/ui/separator";
import { Shield, Building2, Key, Loader2 } from "lucide-react";

interface SignupData {
  username: string;
  password: string;
  name: string;
  email?: string;
}

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  displayName: string;
  enabled: boolean;
}

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SignupData>({
    username: "",
    password: "",
    name: "",
    email: "",
  });

  // Fetch available SSO providers
  const { data: ssoProviders, isLoading: isLoadingProviders } = useQuery<SSOProvider[]>({
    queryKey: ["/api/sso/providers/active"],
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await apiRequest<any>("POST", "/api/signup", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account Created!",
        description: "Welcome to Gigster Garage. You'll now complete a quick setup.",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof SignupData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
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
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <GigsterLogo size="medium" showText={false} />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl brand-heading">Join Gigster Garage</CardTitle>
            <p className="text-xs brand-tagline">Smarter tools for bolder dreams</p>
            <CardDescription className="pt-2">
              Create your account to get started
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange("name")}
                data-testid="input-name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange("username")}
                data-testid="input-username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleInputChange("password")}
                data-testid="input-password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange("email")}
                data-testid="input-email"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="gigster-button-primary w-full" 
              disabled={signupMutation.isPending}
              data-testid="button-signup"
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>

            {/* SSO Providers Section */}
            {isLoadingProviders ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : hasSSOProviders ? (
              <div className="w-full">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {ssoProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleSSOLogin(provider.id)}
                      data-testid={`button-sso-signup-${provider.id}`}
                    >
                      {getProviderIcon(provider.type)}
                      <span>Continue with {provider.displayName || provider.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            
            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
