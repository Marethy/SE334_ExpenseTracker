'use client';

import QRCode from 'react-qr-code';
import { useState } from 'react';
import { Copy, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const MockQRCode = () => {
  const [qrValue, setQrValue] = useState('https://yourapp.com/mock-payment');
  const [showQR, setShowQR] = useState(false);

  const generateMockPaymentQR = () => {
    const mockPaymentId = Math.random().toString(36).substring(7);
    const mockAmount = Math.floor(Math.random() * 10000) + 100;
    const mockPaymentURL = `https://yourapp.com/payment/${mockPaymentId}?amount=${mockAmount}`;
    setQrValue(mockPaymentURL);
    setShowQR(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('QR content copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'qr-code.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Mock QR Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Enter payment URL or text"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
          />
          <Button onClick={generateMockPaymentQR} className="w-full">
            Generate Mock Payment QR
          </Button>
        </div>

        {showQR && qrValue && (
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
              Mock payment QR code generated<br />
              Scan to simulate payment process
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};