import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    console.log("🔍 Debug API - User ID from auth:", userId);

    if (!userId) {
      return NextResponse.json(
        {
          error: "No authenticated user",
          authResult: "FAILED",
        },
        { status: 401 }
      );
    }

    // Test database connection
    console.log("🔌 Testing database connection...");

    // Test raw query
    const accountsRaw = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));
    const categoriesRaw = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
    const transactionsRaw = await db.select().from(transactions).limit(5);

    console.log("📊 Raw data counts:");
    console.log("  Accounts:", accountsRaw.length);
    console.log("  Categories:", categoriesRaw.length);
    console.log("  Transactions:", transactionsRaw.length);

    // Check if user has any data
    const allAccounts = await db.select().from(accounts);
    const allCategories = await db.select().from(categories);
    const allTransactions = await db.select().from(transactions);

    console.log("📈 Total data in DB:");
    console.log("  All Accounts:", allAccounts.length);
    console.log("  All Categories:", allCategories.length);
    console.log("  All Transactions:", allTransactions.length);

    // Check user IDs in database
    const uniqueUserIds = [
      ...new Set([
        ...allAccounts.map((a) => a.userId),
        ...allCategories.map((c) => c.userId),
      ]),
    ];

    console.log("👥 User IDs in database:", uniqueUserIds);
    console.log("🆔 Current auth user ID:", userId);
    console.log("🔍 User ID match:", uniqueUserIds.includes(userId));

    return NextResponse.json({
      authUserId: userId,
      userAccounts: accountsRaw.length,
      userCategories: categoriesRaw.length,
      userTransactions: transactionsRaw.length,
      totalAccounts: allAccounts.length,
      totalCategories: allCategories.length,
      totalTransactions: allTransactions.length,
      userIdsInDb: uniqueUserIds,
      userIdMatch: uniqueUserIds.includes(userId),
      sampleData: {
        accounts: accountsRaw.slice(0, 2),
        categories: categoriesRaw.slice(0, 2),
        transactions: transactionsRaw.slice(0, 2),
      },
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
