/**
 * Production OAuth client_credentials test — loads .env.local, never prints secrets.
 * Usage: npm run test:ebay:oauth
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

async function main() {
  const clientId = process.env.EBAY_APP_ID?.trim();
  const clientSecret = process.env.EBAY_CERT_ID?.trim();

  console.log("env check:", {
    hasAppId: Boolean(clientId),
    hasCertId: Boolean(clientSecret),
    appIdLength: clientId?.length ?? 0,
    certIdLength: clientSecret?.length ?? 0,
    hasStaticOAuthToken: Boolean(process.env.EBAY_OAUTH_TOKEN?.trim()),
  });

  if (!clientId || !clientSecret) {
    console.error("FAIL: set Production EBAY_APP_ID and EBAY_CERT_ID in .env.local");
    process.exit(1);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: SCOPE,
  });

  console.log("POST", TOKEN_URL);
  console.log("scope:", SCOPE);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });

  const text = await res.text();
  console.log("HTTP", res.status);

  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    if (typeof json.access_token === "string") {
      console.log("token_type:", json.token_type);
      console.log("expires_in:", json.expires_in);
      console.log("access_token: <received, length", json.access_token.length, ">");
      console.log("SUCCESS: client_credentials token minted.");
      process.exit(0);
    }
    console.log("response:", JSON.stringify(json, null, 2));
  } catch {
    console.log("response:", text.slice(0, 500));
  }

  console.error("FAIL: no access_token in response.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
