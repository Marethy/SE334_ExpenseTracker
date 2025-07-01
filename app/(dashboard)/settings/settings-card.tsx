"use client";

import { Loader2, Crown } from "lucide-react";
import React from "react";

import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { SubscriptionCheckout } from "@/features/subscriptions/components/subscription-checkout";
import { useCancelSubscription } from "@/features/subscriptions/api/use-cancel-subscription";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const SettingsCard = () => {
  const { data: subscription, isLoading: isLoadingSubscription } =
    useGetSubscription();
  const cancelSubscription = useCancelSubscription();

  const isPremium =
    subscription?.plan === "premium" && subscription?.status === "active";

  const [animationEnabled, setAnimationEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('animationEnabled');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });

  React.useEffect(() => {
    localStorage.setItem('animationEnabled', String(animationEnabled));
  }, [animationEnabled]);

  if (isLoadingSubscription) {
    return (
      <Card className="border-none drop-shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl line-clamp-1">
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full flex items-center justify-center">
            <Loader2 className="size-6 text-slate-300 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1 flex items-center gap-2">
          Settings
          {isPremium && (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              <Crown className="size-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
          <p className="text-sm font-medium w-full lg:w-[16.5rem]">
            Subscription Plan
          </p>
          <div className="w-full flex items-center justify-between">
            <div
              className={cn(
                "text-sm truncate flex items-center gap-2",
                !isPremium && "text-muted-foreground"
              )}
            >
              {isPremium ? (
                <>
                  <Crown className="size-4 text-yellow-500" />
                  Premium Plan
                </>
              ) : (
                "Free Plan"
              )}
            </div>
            <SubscriptionCheckout />
          </div>
        </div>

        {isPremium && (
          <>
            <Separator />
            <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
              <p className="text-sm font-medium w-full lg:w-[16.5rem]">
                Subscription Status
              </p>
              <div className="w-full flex items-center justify-between">
                <div className="text-sm truncate flex items-center">
                  Active until{" "}
                  {subscription?.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <Button
                  onClick={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                  size="sm"
                  variant="destructive"
                >
                  {cancelSubscription.isPending ? "Canceling..." : "Cancel"}
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
          <p className="text-sm font-medium w-full lg:w-[16.5rem]">
            Available Features
          </p>
          <div className="w-full">
            <div className="text-sm text-muted-foreground">
              {isPremium ? (
                <ul className="space-y-1">
                  <li>✅ All chart types</li>
                  <li>✅ CSV Import/Export</li>
                  <li>✅ Advanced Analytics</li>
                  <li>✅ QR Payment Generator</li>
                  <li>✅ Priority Support</li>
                </ul>
              ) : (
                <ul className="space-y-1">
                  <li>✅ Basic charts (Area only)</li>
                  <li>🔒 Advanced chart types</li>
                  <li>🔒 CSV Import/Export</li>
                  <li>🔒 Advanced Analytics</li>
                  <li>🔒 QR Payment Generator</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <Separator />
        <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
          <p className="text-sm font-medium w-full lg:w-[16.5rem]">
            Chart Animations
          </p>
          <div className="w-full flex items-center gap-3">
            <Checkbox
              checked={animationEnabled}
              onCheckedChange={v => setAnimationEnabled(!!v)}
              id="chart-animations-toggle"
            />
            <label htmlFor="chart-animations-toggle" className="text-sm select-none cursor-pointer">
              Enable chart animations
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
