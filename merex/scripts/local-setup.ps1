Write-Host "Merex local setup starting..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed. Install Node.js 20+ and rerun."
  exit 1
}

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "Created .env.local from .env.local.example"
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose up -d db
  Write-Host "Started local postgres via Docker."
} else {
  Write-Warning "Docker not found. Start PostgreSQL manually on localhost:5432."
}

npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed

Write-Host "Local setup complete."
