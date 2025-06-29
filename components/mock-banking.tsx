"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface MockBank {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
}

export const MockBanking = () => {
  const [mockBanks, setMockBanks] = useState<MockBank[]>([
    {
      id: "1",
      name: "Demo Checking Account",
      balance: 25000,
      accountNumber: "**** 1234",
    },
    {
      id: "2",
      name: "Demo Savings Account",
      balance: 150000,
      accountNumber: "**** 5678",
    },
  ]);

  const [newBankName, setNewBankName] = useState("");

  const addMockBank = () => {
    if (!newBankName.trim()) return;

    const newBank: MockBank = {
      id: Date.now().toString(),
      name: newBankName,
      balance: Math.floor(Math.random() * 100000) + 10000,
      accountNumber: `**** ${Math.floor(Math.random() * 9999)}`,
    };

    setMockBanks([...mockBanks, newBank]);
    setNewBankName("");
    toast.success("Mock bank account added!");
  };

  const removeMockBank = (id: string) => {
    setMockBanks(mockBanks.filter((bank) => bank.id !== id));
    toast.success("Mock bank account removed!");
  };

  const syncMockData = () => {
    // Simulate sync by updating balances
    setMockBanks((banks) =>
      banks.map((bank) => ({
        ...bank,
        balance: bank.balance + Math.floor(Math.random() * 1000) - 500,
      }))
    );
    toast.success("Mock bank data synced!");
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Mock Banking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new mock bank account"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
          />
          <Button onClick={addMockBank}>
            <Plus className="size-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {mockBanks.map((bank) => (
            <div
              key={bank.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-blue-500" />
                <div>
                  <p className="font-medium">{bank.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bank.accountNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  ₹{bank.balance.toLocaleString()}
                </p>
                <Button
                  onClick={() => removeMockBank(bank.id)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={syncMockData} className="w-full">
          Sync Mock Bank Data
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          This is a demo banking interface. No real accounts are connected.
        </p>
      </CardContent>
    </Card>
  );
};
