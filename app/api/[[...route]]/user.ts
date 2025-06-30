export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "No authenticated user" },
        { status: 401 }
      );
    }

    const userInfo = {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    };

    console.log("🧑‍💻 Current User Info:", userInfo);

    return NextResponse.json({
      message: "User info logged to console",
      user: userInfo,
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
