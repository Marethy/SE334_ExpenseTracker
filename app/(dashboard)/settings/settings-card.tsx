"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const SettingsCard = () => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
          <p className="text-sm font-medium w-full lg:w-[16.5rem]">
            Application Mode
          </p>
          <div className="w-full flex items-center justify-between">
            <div className="text-sm truncate flex items-center text-green-600">
              Demo Mode - All features available
            </div>
          </div>
        </div>

        <Separator />
        <div className="flex flex-col gap-y-2 lg:flex-row items-center py-4">
          <p className="text-sm font-medium w-full lg:w-[16.5rem]">
            Mock Features
          </p>
          <div className="w-full flex items-center justify-between">
            <div className="text-sm truncate flex items-center">
              QR Payment, Bank Sync, Premium Charts
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
