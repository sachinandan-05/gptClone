import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  console.log("Webhook received:", body);

  return NextResponse.json({ ok: true });
}
