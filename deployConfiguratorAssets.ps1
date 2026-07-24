$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$sourceFolders = @("05l_Bottle", "075l_Bottle", "1l_Bottle") | ForEach-Object {
  Join-Path -Path (Join-Path -Path $repoRoot -ChildPath "3dFiles") -ChildPath $_
}
$manifestPath = Join-Path -Path $repoRoot -ChildPath "docs\js\data\stl-manifest.json"

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

Write-Host "Done. Commit docs/js/data/stl-manifest.json before pushing."

# --- Gallery banner manifest ---
# Scans docs/images/gallery/ for photos and (re)writes gallery-manifest.json, preserving any
# hand-edited caption/location/year already in the manifest (keyed by filename) so reruns don't
# clobber them. New photos get a caption derived from their filename, and no location/year (never
# guessed - better blank than wrong). Edit gallery-manifest.json directly to add or improve any of
# the three; location and year are optional and only show in the banner when present. Entries for
# photos no longer in the folder are dropped.
$galleryFolder = Join-Path -Path $repoRoot -ChildPath "docs\images\gallery"
$galleryManifestPath = Join-Path -Path $repoRoot -ChildPath "docs\js\data\gallery-manifest.json"
$galleryImageExtensions = @("*.jpg", "*.jpeg", "*.png", "*.gif", "*.webp")

function New-DefaultCaption([string]$fileName) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
  ($base -replace "[_-]", " ") -replace "\s+", " "
}

Write-Host "Scanning docs/images/gallery for banner photos"
$galleryFiles = Get-ChildItem -Path (Join-Path -Path $galleryFolder -ChildPath "*") -Include $galleryImageExtensions -File

if (-not $galleryFiles) {
  throw "No images found under docs/images/gallery - refusing to write an empty gallery manifest."
}

$existingEntriesByFile = @{}
if (Test-Path $galleryManifestPath) {
  $existingEntries = Get-Content -Path $galleryManifestPath -Raw | ConvertFrom-Json
  foreach ($entry in $existingEntries) {
    $existingEntriesByFile[$entry.file] = $entry
  }
}

$galleryEntries = $galleryFiles | ForEach-Object {
  $existing = $existingEntriesByFile[$_.Name]
  $caption = if ($existing) { $existing.caption } else { $null }
  if (-not $caption) {
    $caption = New-DefaultCaption $_.Name
  }
  [PSCustomObject]@{
    file     = $_.Name
    caption  = $caption
    location = if ($existing) { $existing.location } else { $null }
    year     = if ($existing) { $existing.year } else { $null }
  }
} | Sort-Object -Property file

Write-Host "Writing gallery-manifest.json ($($galleryEntries.Count) photos)"
$galleryManifestJson = $galleryEntries | ConvertTo-Json
[System.IO.File]::WriteAllText($galleryManifestPath, $galleryManifestJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Done. Commit docs/js/data/gallery-manifest.json before pushing - hand-edit caption/location/year there as you like."
