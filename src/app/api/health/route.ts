import { NextResponse } from "next/server";

// Placeholder API route — proves backend/API routes work.
// Station catalog, search, and stream-proxy endpoints will live under /api.
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "caribbean-radio-hub",
    time: new Date().toISOString(),
  });
}
