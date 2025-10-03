import { NextRequest } from "next/server";

// Health check or basic GET handler
export async function GET(req: NextRequest) {
  return Response.json(
    { status: "ok", service: "clerk-auth" },
    { status: 200 }
  );
}

// Handles Clerk webhooks or auth-related POSTs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // For debugging: log payload in dev
    if (process.env.NODE_ENV === "development") {
      console.log("Clerk webhook received:", body);
    }

    return Response.json(
      { status: "ok", service: "clerk-auth" },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { status: "error", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
