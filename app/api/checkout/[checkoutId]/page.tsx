// app/checkout/[checkoutId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { CheckCircle2, Copy, Crown } from "lucide-react";

import { useUpgradeSubscription } from "@/features/subscriptions/api/use-upgrade-subscription";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const upgradeSubscription = useUpgradeSubscription();

  const mockPaymentUrl = `upi://pay?pa=demo@paytm&am=999&tn=Premium%20Subscription&cu=INR&mc=1234`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const copyPaymentUrl = async () => {
    try {
      await navigator.clipboard.writeText(mockPaymentUrl);
      toast.success("Payment URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const simulatePayment = () => {
    upgradeSubscription.mutate(undefined, {
      onSuccess: () => {
        setTimeout(() => {
          router.push("/");
        }, 2000);
      },
    });
  };

  if (timeLeft === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">
              Session Expired
            </h1>
            <p className="text-muted-foreground mb-4">
              Your checkout session has expired. Please try again.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="size-8 text-yellow-500" />
            <CardTitle className="text-2xl">Premium Checkout</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Time remaining:{" "}
            <span className="font-mono font-semibold text-red-600">
              {formatTime(timeLeft)}
            </span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold">₹999</div>
            <div className="text-sm text-muted-foreground">
              Annual Premium Subscription
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-center">Scan QR Code to Pay</h3>
            <div className="bg-white p-4 rounded-lg flex justify-center">
              <QRCode
                value={mockPaymentUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>

            <Button
              onClick={copyPaymentUrl}
              variant="outline"
              className="w-full"
            >
              <Copy className="size-4 mr-2" />
              Copy Payment URL
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle2 className="size-4 mr-2 text-green-500" />
              <span>All premium features included</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle2 className="size-4 mr-2 text-green-500" />
              <span>1 year subscription</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle2 className="size-4 mr-2 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Demo Mode:</strong> This is a mock payment. Click
              &quot;Simulate Payment&quot; to test the upgrade.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={simulatePayment}
              disabled={upgradeSubscription.isPending}
              className="flex-1"
            >
              {upgradeSubscription.isPending
                ? "Processing..."
                : "Simulate Payment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
