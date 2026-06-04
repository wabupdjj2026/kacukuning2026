import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    // Return simulator link if secrets are not defined in .env
    return NextResponse.json({
      url: `${appUrl}/api/auth/google/simulated-consent`,
      simulated: true,
      reason: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET"
    });
  }

  // Real Google Sign-In Authorization URL
  const queryParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/presentations",
    access_type: "offline",
    prompt: "consent"
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
  return NextResponse.json({ url: authUrl, simulated: false });
}
