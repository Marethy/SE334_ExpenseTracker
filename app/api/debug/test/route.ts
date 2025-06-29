import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    console.log("🧪 Debug API called");

    const { userId } = await auth();
    console.log("👤 User ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: "No user" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Debug API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
