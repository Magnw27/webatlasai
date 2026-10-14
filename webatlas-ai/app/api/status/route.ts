import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    searchConfigured: Boolean(process.env.TAVILY_API_KEY),
    aiConfigured: aiConfigured(),
  });
}