"use client";

import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useGetSummary } from "@/features/summary/api/use-get-summary";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DebugData = () => {
  const accountsQuery = useGetAccounts();
  const categoriesQuery = useGetCategories();
  const transactionsQuery = useGetTransactions();
  const summaryQuery = useGetSummary();

  const testDirectAPI = async () => {
    try {
      console.log("🧪 Testing direct API calls...");

      // Test debug endpoint
      const debugResponse = await fetch("/api/debug/test-data");
      const debugData = await debugResponse.json();
      console.log("🔍 Debug data:", debugData);

      // Test accounts endpoint
      const accountsResponse = await fetch("/api/accounts");
      const accountsData = await accountsResponse.json();
      console.log("🏦 Accounts API:", accountsData);

      // Test categories endpoint
      const categoriesResponse = await fetch("/api/categories");
      const categoriesData = await categoriesResponse.json();
      console.log("📂 Categories API:", categoriesData);
    } catch (error) {
      console.error("❌ API Test Error:", error);
    }
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Debug Data Hooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Accounts:</strong>
            <br />
            Loading: {accountsQuery.isLoading ? "🔄" : "✅"}
            <br />
            Error: {accountsQuery.error ? "❌" : "✅"}
            <br />
            Count: {accountsQuery.data?.length || 0}
          </div>

          <div>
            <strong>Categories:</strong>
            <br />
            Loading: {categoriesQuery.isLoading ? "🔄" : "✅"}
            <br />
            Error: {categoriesQuery.error ? "❌" : "✅"}
            <br />
            Count: {categoriesQuery.data?.length || 0}
          </div>

          <div>
            <strong>Transactions:</strong>
            <br />
            Loading: {transactionsQuery.isLoading ? "🔄" : "✅"}
            <br />
            Error: {transactionsQuery.error ? "❌" : "✅"}
            <br />
            Count: {transactionsQuery.data?.length || 0}
          </div>

          <div>
            <strong>Summary:</strong>
            <br />
            Loading: {summaryQuery.isLoading ? "🔄" : "✅"}
            <br />
            Error: {summaryQuery.error ? "❌" : "✅"}
            <br />
            Data: {summaryQuery.data ? "✅" : "❌"}
          </div>
        </div>

        {accountsQuery.error && (
          <div className="text-red-600 text-xs">
            <strong>Accounts Error:</strong> {accountsQuery.error.message}
          </div>
        )}

        {categoriesQuery.error && (
          <div className="text-red-600 text-xs">
            <strong>Categories Error:</strong> {categoriesQuery.error.message}
          </div>
        )}

        {transactionsQuery.error && (
          <div className="text-red-600 text-xs">
            <strong>Transactions Error:</strong>{" "}
            {transactionsQuery.error.message}
          </div>
        )}

        <Button onClick={testDirectAPI} variant="outline" size="sm">
          Test Direct API Calls
        </Button>

        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
};
