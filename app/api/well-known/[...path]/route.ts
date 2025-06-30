export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");

  // Handle Chrome DevTools specific request
  if (path === "com.chrome.devtools.json") {
    return NextResponse.json({
      version: "1.0",
      name: "Finance SaaS Platform",
      description: "Personal Finance Management Platform",
      author: "Your Name",
      homepage_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      content_scripts: [],
      background: {},
      permissions: [],
      manifest_version: 3,
    });
  }

  // Handle other well-known requests
  const wellKnownResponses: Record<string, any> = {
    "security.txt": {
      contact: "mailto:security@yourapp.com",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      preferred_languages: "en",
    },
    "robots.txt": `User-agent: *
Allow: /
Disallow: /api/
Disallow: /.well-known/`,
    "manifest.json": {
      name: "Finance SaaS Platform",
      short_name: "FinanceSaaS",
      description: "Personal Finance Management Platform",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3b82f6",
      icons: [
        {
          src: "/logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
  };

  const response = wellKnownResponses[path];

  if (response) {
    if (path === "robots.txt" || path === "security.txt") {
      return new NextResponse(response, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
    return NextResponse.json(response);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
