Write-Host "Starting Merex locally..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed. Install Node.js 20+ and rerun."
  exit 1
}

npm run dev
