import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0",
    name: "Finance SaaS Platform",
    description: "DevTools configuration for Finance SaaS Platform",
    content_scripts: [],
    background: {},
    permissions: [],
  });
}
