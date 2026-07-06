#!/usr/bin/env bash
# Raw curl OAuth test using .env.local — does not print App ID or Cert ID.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi
# Load only EBAY_APP_ID / EBAY_CERT_ID via node (handles special chars safely)
eval "$(node -e "
const fs=require('fs');
const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync('.env.local'));
const id=(env.EBAY_APP_ID||'').trim();
const cert=(env.EBAY_CERT_ID||'').trim();
if(!id||!cert){ console.error('Missing EBAY_APP_ID or EBAY_CERT_ID in .env.local'); process.exit(1);} 
const b=Buffer.from(id+':'+cert).toString('base64');
console.log('export EBAY_BASIC='+JSON.stringify(b));
")"
echo "POST https://api.ebay.com/identity/v1/oauth2/token"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST 'https://api.ebay.com/identity/v1/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H "Authorization: Basic ${EBAY_BASIC}" \
  -d 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope' \
  | node -e "
let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
  const m=d.match(/HTTP_STATUS:(\\d+)/);
  const status=m?m[1]:'?';
  const body=d.replace(/\\nHTTP_STATUS:\\d+\\n?$/,'');
  try {
    const j=JSON.parse(body);
    if(j.access_token){ delete j.access_token; j.access_token='[redacted]'; }
    console.log('HTTP', status);
    console.log(JSON.stringify(j,null,2));
  } catch { console.log('HTTP', status); console.log(body.slice(0,500)); }
});"
unset EBAY_BASIC
