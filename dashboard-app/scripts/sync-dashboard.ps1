$ErrorActionPreference = "Stop"

$appRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $appRoot
$targetDir = Join-Path $appRoot "app"

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot "marketing-dashboard.html") -Destination (Join-Path $targetDir "marketing-dashboard.html") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "site-config.js") -Destination (Join-Path $targetDir "site-config.js") -Force

Write-Host "Dashboard files synced to $targetDir"
