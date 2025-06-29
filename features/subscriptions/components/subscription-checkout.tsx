import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";

import { Button } from "@/components/ui/button";

export const SubscriptionCheckout = () => {
  const checkout = useCheckoutSubscription();
  const { data: subscription, isLoading: isLoadingSubscription } =
    useGetSubscription();

  const isPremium =
    subscription?.plan === "premium" && subscription?.status === "active";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => checkout.mutate()}
      disabled={checkout.isPending || isLoadingSubscription}
    >
      {isPremium ? "Manage" : "Upgrade"}
    </Button>
  );
};
