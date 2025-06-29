"use client";

import QRCode from "react-qr-code";
import { useState } from "react";
import { Copy, Download, Crown } from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const MockQRCode = () => {
  const [qrValue, setQrValue] = useState("https://yourapp.com/mock-payment");
  const [showQR, setShowQR] = useState(false);
  const { shouldBlock, triggerPaywall } = usePaywall();

  const generateMockPaymentQR = () => {
    if (shouldBlock) {
      triggerPaywall();
      return;
    }

    const mockPaymentId = Math.random().toString(36).substring(7);
    const mockAmount = Math.floor(Math.random() * 10000) + 100;
    const mockPaymentURL = `https://yourapp.com/payment/${mockPaymentId}?amount=${mockAmount}`;
    setQrValue(mockPaymentURL);
    setShowQR(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success("QR content copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "qr-code.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1 flex items-center gap-2">
          QR Payment Generator
          {shouldBlock && <Crown className="size-5 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {shouldBlock && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="size-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-800">Premium Feature</h3>
            </div>
            <p className="text-sm text-yellow-700">
              QR Payment Generator is available for Premium subscribers only.
            </p>
            <Button
              onClick={triggerPaywall}
              className="mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              size="sm"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Input
            placeholder="Enter payment URL or text"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            disabled={shouldBlock}
          />
          <Button
            onClick={generateMockPaymentQR}
            className="w-full"
            disabled={shouldBlock}
          >
            Generate {shouldBlock ? "🔒" : "Mock"} Payment QR
          </Button>
        </div>

        {showQR && qrValue && !shouldBlock && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                id="qr-code-svg"
                value={qrValue}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 200 200`}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="size-4 mr-2" />
                Copy URL
              </Button>
              <Button onClick={downloadQR} variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Download
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Mock payment QR code generated
              <br />
              Scan to simulate payment process
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
