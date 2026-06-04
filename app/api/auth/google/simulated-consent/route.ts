import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Return HTML for a beautiful Google Consent Screen mimic flow
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in with Google - Simulasi Portal</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 16px;
          box-sizing: border-box;
        }
        .container {
          background: #ffffff;
          border: 1px solid #DADCE0;
          border-radius: 8px;
          width: 100%;
          max-width: 440px;
          padding: 36px 40px;
          box-sizing: border-box;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .logo {
          width: 74px;
          height: 24px;
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5px;
          font-weight: 500;
          font-size: 22px;
        }
        .g-blue { color: #4285F4; }
        .g-red { color: #EA4335; }
        .g-yellow { color: #FBBC05; }
        .g-blue { color: #4285F4; }
        .g-green { color: #34A853; }
        .g-red-last { color: #EA4335; }
        
        h1 {
          font-size: 24px;
          color: #202124;
          margin: 0 0 8px 0;
          font-weight: 400;
        }
        .subtitle {
          font-size: 15px;
          color: #5F6368;
          margin: 0 0 28px 0;
          line-height: 1.4;
        }
        .account-list {
          text-align: left;
          margin-bottom: 24px;
        }
        .account-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #E8EAED;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .account-item:hover {
          background-color: #F8F9FA;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0e0e0;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 14px;
        }
        .avatar-y { background: #4285F4; }
        .avatar-b { background: #EA4335; }
        .avatar-c { background: #FBBC05; }
        .avatar-d { background: #34A853; }
        .avatar-custom { background: #64748B; }

        .account-details {
          flex-grow: 1;
        }
        .account-name {
          font-size: 14px;
          font-weight: 500;
          color: #3C4043;
          margin: 0;
        }
        .account-email {
          font-size: 12px;
          color: #5F6368;
          margin: 2px 0 0 0;
        }
        
        .custom-form {
          border-top: 2px dashed #E2E8F0;
          margin-top: 16px;
          padding-top: 16px;
          text-align: left;
        }
        .form-title {
          font-size: 13px;
          font-weight: bold;
          color: #475569;
          margin-bottom: 10px;
          display: block;
        }
        .input-group {
          margin-bottom: 12px;
        }
        .input-group label {
          font-size: 11px;
          font-weight: bold;
          color: #64748B;
          display: block;
          margin-bottom: 4px;
        }
        .input-group input {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          box-sizing: border-box;
          outline: none;
        }
        .input-group input:focus {
          border-color: #4285F4;
        }
        .btn-submit {
          width: 100%;
          padding: 10px;
          background: #1a73e8;
          color: white;
          border: none;
          font-size: 13px;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-submit:hover {
          background-color: #1557b0;
        }

        .footer {
          font-size: 12px;
          color: #5F6368;
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
        }
        .footer-link {
          color: #1a73e8;
          text-decoration: none;
        }
        .badge {
          background-color: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1E40AF;
          font-size: 10px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <span class="g-blue">G</span>
          <span class="g-red">o</span>
          <span class="g-yellow">o</span>
          <span class="g-blue">g</span>
          <span class="g-green">l</span>
          <span class="g-red-last">e</span>
        </div>
        
        <div class="badge">SANDBOX DEVELOPER MODE / SIMULASI</div>
        <h1>Pilih akun</h1>
        <p class="subtitle">untuk melanjutkan ke Portal Kelas Kepahaman Pathfinder</p>
        
        <div class="account-list">
          <div class="account-item" onclick="selectPreset('Yocku Haris', 'yockuharis172@gmail.com')">
            <div class="avatar avatar-y">Y</div>
            <div class="account-details">
              <p class="account-name">Yocku Haris</p>
              <p class="account-email">yockuharis172@gmail.com</p>
            </div>
          </div>
          
          <div class="account-item" onclick="selectPreset('Budi Handoko', 'budi.handoko@gmail.com')">
            <div class="avatar avatar-b">B</div>
            <div class="account-details">
              <p class="account-name">Budi Handoko</p>
              <p class="account-email">budi.handoko@gmail.com</p>
            </div>
          </div>

          <div class="account-item" onclick="selectPreset('Clara Sitorus', 'clara.sitorus@gmail.com')">
            <div class="avatar avatar-c">C</div>
            <div class="account-details">
              <p class="account-name">Clara Sitorus</p>
              <p class="account-email">clara.sitorus@gmail.com</p>
            </div>
          </div>

          <div class="account-item" onclick="selectPreset('Danang Wijayanto', 'danang.w@gmail.com')">
            <div class="avatar avatar-d">D</div>
            <div class="account-details">
              <p class="account-name">Danang Wijayanto</p>
              <p class="account-email">danang.w@gmail.com</p>
            </div>
          </div>
        </div>

        <div class="custom-form">
          <span class="form-title">Gunakan Google Email Kustom:</span>
          
          <div class="input-group">
            <label for="custom-name">Nama Lengkap</label>
            <input type="text" id="custom-name" placeholder="Contoh: Hermawan Wijaya">
          </div>

          <div class="input-group">
            <label for="custom-email">Alamat Email Google</label>
            <input type="email" id="custom-email" placeholder="Contoh: hermawan@gmail.com">
          </div>

          <button class="btn-submit" onclick="submitCustom()">Masuk dengan Akun Baru</button>
        </div>

        <div class="footer">
          <div>Bahasa Indonesia</div>
          <div>
            <span class="footer-link">Bantuan</span> &bull; 
            <span class="footer-link">Privasi</span>
          </div>
        </div>
      </div>

      <script>
        function sendPayload(name, email) {
          const payload = {
            name: name,
            email: email,
            googleId: "google_" + Date.now(),
            picture: "",
            accessToken: "simulated_access_token_xyz123"
          };

          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              payload: payload
            }, '*');
            window.close();
          } else {
            alert('Gagal berkomunikasi dengan jendela utama. Jendela ini akan ditutup.');
            window.close();
          }
        }

        function selectPreset(name, email) {
          sendPayload(name, email);
        }

        function submitCustom() {
          const nameInput = document.getElementById('custom-name').value.trim();
          const emailInput = document.getElementById('custom-email').value.trim();

          if (!nameInput || !emailInput) {
            alert('Silakan isi Nama Lengkap dan Alamat Email Google!');
            return;
          }

          if (!emailInput.includes('@')) {
            alert('Format email salah!');
            return;
          }

          sendPayload(nameInput, emailInput);
        }
      </script>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}
