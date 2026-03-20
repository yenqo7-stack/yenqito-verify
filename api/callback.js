const ROBLOX_CLIENT_ID     = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const ROBLOX_REDIRECT_URI  = process.env.ROBLOX_REDIRECT_URI;
const BOT_SECRET           = process.env.BOT_SECRET;
const BOT_WEBHOOK_URL      = process.env.BOT_WEBHOOK_URL;

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send(errorPage("Ungültiger Aufruf."));
  }

  // ── Token holen ────────────────────────────────────────
  const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  ROBLOX_REDIRECT_URI,
      client_id:     ROBLOX_CLIENT_ID,
      client_secret: ROBLOX_CLIENT_SECRET,
    }),
  });

  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;

  if (!access_token) {
    return res.status(400).send(errorPage("Token-Fehler. Bitte /verify erneut nutzen."));
  }

  // ── Roblox Profil holen ────────────────────────────────
  const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const userInfo = await userRes.json();
  const roblox_id   = String(userInfo.sub);
  const roblox_name = userInfo.preferred_username || userInfo.name || "Roblox";

  // ── Bot benachrichtigen ────────────────────────────────
  await fetch(BOT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Secret": BOT_SECRET,
    },
    body: JSON.stringify({ state, roblox_id, roblox_name }),
  });

  // ── Erfolgsseite ───────────────────────────────────────
  return res.status(200).send(successPage(roblox_name));
}

function successPage(name) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifiziert ✅</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f0f17;
      color: #e0e0e0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background: #1a1a2e;
      border: 1px solid #5865F2;
      border-radius: 20px;
      padding: 48px 56px;
      text-align: center;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 0 48px #5865F222;
    }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { color: #57F287; font-size: 24px; margin-bottom: 12px; }
    p  { color: #a0a0b0; font-size: 15px; line-height: 1.6; }
    .name {
      color: #5865F2;
      font-weight: 700;
      font-size: 20px;
      margin: 12px 0;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #555570;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Erfolgreich verknüpft!</h1>
    <p>Dein Discord Account wurde mit</p>
    <div class="name">@${name}</div>
    <p>verbunden.<br>Du kannst dieses Fenster schließen.</p>
    <div class="footer">Yenqito's Studio Manager</div>
  </div>
</body>
</html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Fehler ❌</title>
  <style>
    body {
      background: #0f0f17; color: #e0e0e0;
      font-family: 'Segoe UI', sans-serif;
      display: flex; justify-content: center; align-items: center; min-height: 100vh;
    }
    .card {
      background: #1a1a2e; border: 1px solid #ED4245;
      border-radius: 20px; padding: 48px 56px;
      text-align: center; max-width: 440px; width: 90%;
    }
    h1 { color: #ED4245; margin-bottom: 12px; }
    p  { color: #a0a0b0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Fehler</h1>
    <p>${msg}</p>
  </div>
</body>
</html>`;
}
