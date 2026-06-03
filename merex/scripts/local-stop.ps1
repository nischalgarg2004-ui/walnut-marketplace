if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose down
  Write-Host "Stopped local Docker services."
} else {
  Write-Warning "Docker not found; stop your local postgres manually."
}
