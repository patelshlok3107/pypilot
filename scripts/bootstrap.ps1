param(
  [switch]$Build
)

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

if ($Build) {
  docker compose up --build
} else {
  docker compose up
}
