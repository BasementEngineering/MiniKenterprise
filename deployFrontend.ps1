$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$frontendFolder = Join-Path -Path $repoRoot -ChildPath "minikenterprise_frontend"
$distFolder = Join-Path -Path $frontendFolder -ChildPath "dist"
$firmwareFolder = Join-Path -Path $repoRoot -ChildPath "MiniKenterpriseCode"

Write-Host "Building the Control UI with Vite"
Push-Location $frontendFolder
npm run build
Pop-Location

Write-Host "Encoding the build output into Arduino headers"
python (Join-Path -Path $repoRoot -ChildPath "tools\encodeInArduino.py") $distFolder

Write-Host "Copying generated headers into MiniKenterpriseCode"
Copy-Item -Path (Join-Path -Path $distFolder -ChildPath "website_content.h") -Destination $firmwareFolder -Force
Copy-Item -Path (Join-Path -Path $distFolder -ChildPath "website_functions.h") -Destination $firmwareFolder -Force

Write-Host "Done. Recompile MiniKenterpriseCode.ino to include the updated Control UI."
