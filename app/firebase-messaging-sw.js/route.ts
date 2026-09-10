import { NextResponse } from "next/server";
import { generateServiceWorker } from "@/lib/firebase";

export const dynamic = "force-static";

export async function GET() {
  return new NextResponse(generateServiceWorker(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
