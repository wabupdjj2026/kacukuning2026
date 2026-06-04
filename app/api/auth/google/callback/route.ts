import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F8FAFC; margin:0;">
          <div style="background: white; border: 1px solid #E2E8F0; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 16px;">
            <h1 style="color: #EF4444; font-size: 18px; margin-bottom: 8px;">Gagal Masuk</h1>
            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
              Terjadi kesalahan saat masuk dengan Google: ${error || "Otorisasi ditolak oleh pengguna."}
            </p>
            <button onclick="window.close()" style="background: #2563EB; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
              Tutup Jendela
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Attempt to exchange authentication code
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F8FAFC; margin:0;">
            <div style="background: white; border: 1px solid #E2E8F0; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 500px; margin: 16px;">
              <h1 style="color: #EF4444; font-size: 18px; margin-bottom: 8px;">Token Exchange Error</h1>
              <p style="color: #64748B; font-size: 12px; text-align: left; background: #F1F5F9; padding:12px; border-radius:6px; overflow-x: auto; margin-bottom: 16px;">
                ${errorText}
              </p>
              <button onclick="window.close()" style="background: #0F172A; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
                Tutup Jendela
              </button>
            </div>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    let googleUser: any = null;

    if (idToken) {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        googleUser = JSON.parse(payloadJson);
      }
    }

    if (!googleUser && tokens.access_token) {
      // Fallback: Fetch user details via UserInfo API using Access Token
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (userInfoResponse.ok) {
        googleUser = await userInfoResponse.json();
      }
    }

    if (!googleUser) {
      throw new Error("Gagal mengurai profil data pengguna dari Google.");
    }

    const payload = {
      email: googleUser.email,
      name: googleUser.name || googleUser.given_name || "Peserta Google",
      googleId: googleUser.sub,
      picture: googleUser.picture || "",
      accessToken: tokens.access_token || ""
    };

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F8FAFC; margin:0;">
          <div style="background: white; border: 1px solid #E2E8F0; padding: 32px 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 16px;">
            <div style="width: 52px; height: 52px; background: #D1FAE5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 24px; font-weight: bold;">✓</div>
            <h1 style="color: #0F172A; font-size: 18px; margin-bottom: 8px;">Masuk Berhasil!</h1>
            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
              Menghubungkan akun Google Anda <b>${payload.name}</b> ke sistem sertifikasi...
            </p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  payload: ${JSON.stringify(payload)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (err: any) {
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F8FAFC; margin:0;">
          <div style="background: white; border: 1px solid #E2E8F0; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 16px;">
            <h1 style="color: #EF4444; font-size: 18px; margin-bottom: 8px;">Sistem Error</h1>
            <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
              Gagal mengautentikasi: ${err?.message || "Kesalahan internal."}
            </p>
            <button onclick="window.close()" style="background: #0F172A; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
              Tutup Jendela
            </button>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }
}
