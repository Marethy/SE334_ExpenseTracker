"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DebugUser = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      console.log("🧑‍💻 User ID:", user.id);
      console.log("📧 Email:", user.emailAddresses[0]?.emailAddress);
      console.log("👤 Full Name:", `${user.firstName} ${user.lastName}`);
      console.log("📅 Created:", user.createdAt);
    }
  }, [user, isLoaded]);

  const logUserInfo = async () => {
    if (user) {
      console.log("=== USER DEBUG INFO ===");
      console.log("User ID:", user.id);
      console.log("Email:", user.emailAddresses[0]?.emailAddress);
      console.log("First Name:", user.firstName);
      console.log("Last Name:", user.lastName);
      console.log("Created At:", user.createdAt);
      console.log("Updated At:", user.updatedAt);
      console.log("========================");

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(user.id);
        alert("User ID copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const fetchUserFromAPI = async () => {
    try {
      const response = await fetch("/api/debug/user");
      const data = await response.json();
      console.log("API Response:", data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  if (!isLoaded) {
    return <div>Loading user info...</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Debug User Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
          </div>
          <div>
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </div>
          <div>
            <strong>Created:</strong> {user.createdAt?.toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={logUserInfo} variant="outline" size="sm">
            Log & Copy User ID
          </Button>
          <Button onClick={fetchUserFromAPI} variant="outline" size="sm">
            Fetch from API
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
};
