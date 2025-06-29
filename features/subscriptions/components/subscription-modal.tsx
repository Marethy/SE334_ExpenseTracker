// features/subscriptions/components/subscription-modal.tsx
import { CheckCircle2, Crown, Zap } from "lucide-react";

import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";
import { useSubscriptionModal } from "@/features/subscriptions/hooks/use-subscription-modal";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const SubscriptionModal = () => {
  const checkout = useCheckoutSubscription();
  const { isOpen, onClose } = useSubscriptionModal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex items-center space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="size-8 text-yellow-500" />
            <div>
              <DialogTitle className="text-center text-xl">
                Upgrade to Premium
              </DialogTitle>
              <Badge variant="secondary" className="mt-1">
                <Zap className="size-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-center">
            Unlock all premium features and take control of your finances
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{`${formatCurrency(1000000)}VND`}</div>
            <div className="text-sm text-muted-foreground">per year</div>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center">
              <CheckCircle2 className="size-5 mr-3 fill-green-500 text-white" />
              <span className="text-sm">
                All chart types (Area, Line, Bar, Pie, Radar)
              </span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="size-5 mr-3 fill-green-500 text-white" />
              <span className="text-sm">CSV Import & Export</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="size-5 mr-3 fill-green-500 text-white" />
              <span className="text-sm">Advanced Analytics</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="size-5 mr-3 fill-green-500 text-white" />
              <span className="text-sm">Priority Support</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="size-5 mr-3 fill-green-500 text-white" />
              <span className="text-sm">QR Payment Generator</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="pt-2 mt-4 gap-y-2">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? "Processing..." : "Upgrade Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
