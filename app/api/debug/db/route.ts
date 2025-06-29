// app/api/debug/db/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";

export async function GET() {
  try {
    console.log("🔌 Testing database connection...");

    // Test basic connection
    const result = await db.select().from(accounts).limit(1);
    console.log("✅ Database connection successful");
    console.log("📊 Sample data:", result);

    return NextResponse.json({
      success: true,
      message: "Database connection OK",
      sampleCount: result.length,
    });
  } catch (error) {
    console.error("❌ Database Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Database error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
