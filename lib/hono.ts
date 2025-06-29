import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return appUrl;
  }
  return "http://localhost:3000";
};

const baseUrl = getBaseUrl();

console.log("🔗 Hono client connecting to:", baseUrl);

export const client = hc<AppType>(baseUrl);
