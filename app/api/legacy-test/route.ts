import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Just return test data for now - no database, no CSV
  return NextResponse.json({
    success: true,
    message: "Legacy test endpoint is working!",
    testData: [
      { artist: "Test Artist", song: "Test Song", mfCode: "SC1234", track: "05" }
    ]
  });
}
