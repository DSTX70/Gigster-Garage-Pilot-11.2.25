import { useQuery } from "@tanstack/react-query";

export interface IntegrationInfo {
  configured: boolean;
  enables: string[];
  missingSecrets: string[];
}

export interface SocialIntegrations {
  x: IntegrationInfo;
  instagram: IntegrationInfo;
  linkedin: IntegrationInfo;
}

export interface SystemStatus {
  storageMode: string;
  integrations: {
    database: IntegrationInfo;
    ai: IntegrationInfo;
    email: IntegrationInfo;
    sms: IntegrationInfo;
    stripe: IntegrationInfo;
    slack: IntegrationInfo;
    social: SocialIntegrations;
    objectStorage: IntegrationInfo;
  };
  database: boolean;
  ai: boolean;
  email: boolean;
  sms: boolean;
  stripe: boolean;
  objectStorage: boolean;
  slack: boolean;
  dth: boolean;
}

export function useIntegrationStatus() {
  const { data, isLoading, error, refetch } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
    staleTime: 60000,
  });

  return {
    status: data,
    integrations: data?.integrations,
    isLoading,
    error,
    refetch,
    canSendEmail: data?.email ?? false,
    canSendSMS: data?.sms ?? false,
    canProcessPayments: data?.stripe ?? false,
    canUseAI: data?.ai ?? false,
    canPostToX: data?.integrations?.social?.x?.configured ?? false,
    canPostToInstagram: data?.integrations?.social?.instagram?.configured ?? false,
    canPostToLinkedIn: data?.integrations?.social?.linkedin?.configured ?? false,
    hasAnySocialConfigured: 
      (data?.integrations?.social?.x?.configured ?? false) ||
      (data?.integrations?.social?.instagram?.configured ?? false) ||
      (data?.integrations?.social?.linkedin?.configured ?? false),
  };
}
