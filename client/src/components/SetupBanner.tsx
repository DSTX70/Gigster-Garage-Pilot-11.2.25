import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Palette, X } from "lucide-react";
import { useState } from "react";

type ProfileResponse = {
  onboarding: {
    completedAt?: string | null;
    brandSetupCompleted?: boolean;
  } | null;
};

export function SetupBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile/me"],
    staleTime: 1000 * 60 * 5,
  });

  const onboarding = data?.onboarding;
  const showBanner =
    !dismissed &&
    onboarding?.completedAt &&
    !onboarding?.brandSetupCompleted;

  if (!showBanner) return null;

  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/50 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Palette className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            Finish setup (2 minutes)
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Add your brand identity to make everything feel like your business.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/settings/brand">
          <span
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition cursor-pointer"
            data-testid="button-finish-brand-setup"
          >
            Set up brand
          </span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
          aria-label="Dismiss"
          data-testid="button-dismiss-setup-banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
