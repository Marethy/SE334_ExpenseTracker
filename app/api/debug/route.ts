import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("🔍 DB URL =", process.env.DRIZZLE_DATABASE_URL);
  return NextResponse.json({ url: process.env.DRIZZLE_DATABASE_URL });
} 