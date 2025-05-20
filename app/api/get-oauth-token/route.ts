import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authData = await auth();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const userId = authData.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!provider) {
      return NextResponse.json({ error: "Provider required" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.clerk.dev/v1/users/${userId}/oauth_access_tokens/${provider}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get OAuth token: ${response.statusText}`);
    }

    const tokens = await response.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: `No OAuth token found for provider: ${provider}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ token: tokens[0].token });
  } catch (error) {
    console.error("Failed to get OAuth token:", error);
    return NextResponse.json(
      { error: "Failed to get OAuth token" },
      { status: 500 }
    );
  }
}
