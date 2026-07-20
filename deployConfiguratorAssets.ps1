$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$sourceFolders = @("05l_Bottle", "075l_Bottle", "1l_Bottle") | ForEach-Object {
  Join-Path -Path (Join-Path -Path $repoRoot -ChildPath "3dFiles") -ChildPath $_
}
$flashSiteFolder = Join-Path -Path $repoRoot -ChildPath "flash-site"
$manifestPath = Join-Path -Path $flashSiteFolder -ChildPath "js\data\stl-manifest.json"
$downloadsFolder = Join-Path -Path $flashSiteFolder -ChildPath "downloads"
$componentImagesSource = Join-Path -Path $repoRoot -ChildPath "docs\materials\images"
$componentImagesDest = Join-Path -Path $flashSiteFolder -ChildPath "img\components"
$componentImageExtensions = @("*.jpg", "*.jpeg", "*.png", "*.gif", "*.webp")
$variantImagesSource = Join-Path -Path $repoRoot -ChildPath "images"
$variantImagesDest = Join-Path -Path $flashSiteFolder -ChildPath "img\variants"

Write-Host "Scanning 3dFiles bottle folders for STL files"
$stlFiles = $sourceFolders | Where-Object { Test-Path $_ } | ForEach-Object {
  Get-ChildItem -Path $_ -Filter "*.stl" -File
}

if (-not $stlFiles) {
  throw "No STL files found under 3dFiles/{05l,075l,1l}_Bottle - refusing to write an empty manifest."
}

$manifestPaths = $stlFiles | ForEach-Object {
  $relative = $_.FullName.Substring($repoRoot.Length + 1) -replace "\\", "/"
  $relative
} | Sort-Object

Write-Host "Writing stl-manifest.json ($($manifestPaths.Count) files)"
$manifestJson = $manifestPaths | ConvertTo-Json
# Set-Content -Encoding utf8 writes a BOM on Windows PowerShell 5.1, which breaks strict JSON
# parsers (e.g. Node's JSON.parse). Write plain UTF-8 without a BOM instead.
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Resetting flash-site/downloads"
if (Test-Path $downloadsFolder) {
  Remove-Item -Path $downloadsFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $downloadsFolder | Out-Null

$totalBytes = 0
foreach ($file in $stlFiles) {
  $relativeToThreeDFiles = $file.FullName.Substring((Join-Path -Path $repoRoot -ChildPath "3dFiles").Length + 1)
  $destination = Join-Path -Path $downloadsFolder -ChildPath $relativeToThreeDFiles
  New-Item -ItemType Directory -Path (Split-Path -Path $destination -Parent) -Force | Out-Null
  Copy-Item -Path $file.FullName -Destination $destination -Force
  $totalBytes += $file.Length
}

Write-Host "Copied $($stlFiles.Count) STL files ($([math]::Round($totalBytes / 1MB, 2)) MB) into flash-site/downloads"

# Component photos live in docs/materials/images (shared with the workshop docs) and get
# mirrored wholesale into flash-site/img/components - variants.js's `image` fields reference
# them by filename under that folder. Raster formats only (skips e.g. the .xcf source file).
Write-Host "Syncing component images"
if (Test-Path $componentImagesDest) {
  Remove-Item -Path $componentImagesDest -Recurse -Force
}
New-Item -ItemType Directory -Path $componentImagesDest | Out-Null

$componentImages = Get-ChildItem -Path (Join-Path -Path $componentImagesSource -ChildPath "*") -Include $componentImageExtensions -File
foreach ($image in $componentImages) {
  Copy-Item -Path $image.FullName -Destination (Join-Path -Path $componentImagesDest -ChildPath $image.Name) -Force
}
Write-Host "Copied $($componentImages.Count) component image(s) into flash-site/img/components"

# Preset/variant hero photos live in the repo-root images/ folder and are matched by the
# "<Name>_Variant_<year>.<ext>" naming convention (e.g. Vorarlberg_Variant_2024.JPG) that
# variants.js's preset `image` fields expect - name new preset photos that way.
Write-Host "Syncing variant preset images"
if (Test-Path $variantImagesDest) {
  Remove-Item -Path $variantImagesDest -Recurse -Force
}
New-Item -ItemType Directory -Path $variantImagesDest | Out-Null

$variantImages = Get-ChildItem -Path (Join-Path -Path $variantImagesSource -ChildPath "*_Variant_*") -File
foreach ($image in $variantImages) {
  Copy-Item -Path $image.FullName -Destination (Join-Path -Path $variantImagesDest -ChildPath $image.Name) -Force
}
Write-Host "Copied $($variantImages.Count) variant preset image(s) into flash-site/img/variants"

Write-Host "Done. Commit flash-site/js/data/stl-manifest.json, flash-site/downloads, flash-site/img/components and flash-site/img/variants before pushing."
