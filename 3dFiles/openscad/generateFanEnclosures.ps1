<#
.SYNOPSIS
  Batch-generates fan enclosure STLs for every (bottle, motor, prop) combination, from
  FanEnclosure.scad and enclosureSizes.json - so adding a new supported diameter to the JSON
  is the only step needed to get printable files for every combination it's part of, no manual
  Fusion 360 modeling.

.DESCRIPTION
  Reads enclosureSizes.json (bottles, motor diameters, prop diameters) and generates one STL
  per bottle x motor diameter x prop diameter combination - the full cross product, not just
  combinations already offered as a Variant in docs/js/data/variants.js (that's a separate,
  smaller "what's actually offered" list; this script's job is just "make sure a file exists
  for every size someone might want"). Output paths follow the exact naming convention
  docs/js/stl-lookup.js expects:
    3dFiles/<bottle>_Bottle/FanEnclosure_<bottle>_M<motorDiameter>_P<propDiameter>.stl

  Requires OpenSCAD (https://openscad.org/) - auto-detected on PATH or at its default Windows
  install location. FanEnclosure.scad's dimensions are still rough guesses - review/measure
  before printing or wiring results into variants.js.

.PARAMETER Force
  Regenerate files that already exist. Without this switch, existing files are left alone
  (so this never silently clobbers a hand-modeled, already-verified Fusion 360 part).
#>

param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

# Script lives at 3dFiles/openscad/ - repo root is two levels up.
$repoRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
$scadFile = Join-Path -Path $PSScriptRoot -ChildPath "FanEnclosure.scad"
$configPath = Join-Path -Path $PSScriptRoot -ChildPath "enclosureSizes.json"

# winget/the default installer don't reliably put openscad.exe on PATH - fall back to the
# standard install location before giving up.
$openscadExe = (Get-Command openscad -ErrorAction SilentlyContinue).Source
if (-not $openscadExe) {
  $defaultInstallPath = "C:\Program Files\OpenSCAD\openscad.exe"
  if (Test-Path $defaultInstallPath) {
    $openscadExe = $defaultInstallPath
  } else {
    throw "openscad.exe not found on PATH or at '$defaultInstallPath'. Install OpenSCAD (https://openscad.org/) or edit `$openscadExe in this script."
  }
}
Write-Host "Using OpenSCAD at: $openscadExe"

function Format-DiameterToken([double]$diameterMm) {
  # Mirrors docs/js/stl-lookup.js's formatDiameterToken: decimals become hyphens.
  $text = $diameterMm.ToString([System.Globalization.CultureInfo]::InvariantCulture)
  return $text -replace "\.", "-"
}

if (-not (Test-Path $configPath)) {
  throw "enclosureSizes.json not found at '$configPath'."
}
$config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
Write-Host "Loaded $($config.bottles.Count) bottle(s), $($config.motorDiametersMm.Count) motor diameter(s), $($config.propDiametersMm.Count) prop diameter(s) from enclosureSizes.json"

$generated = 0
$skipped = 0

foreach ($bottle in $config.bottles) {
  $destFolder = Join-Path -Path (Join-Path -Path $repoRoot -ChildPath "3dFiles") -ChildPath $bottle.folder
  New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

  foreach ($motorDiameterMm in $config.motorDiametersMm) {
    $motorToken = Format-DiameterToken $motorDiameterMm

    foreach ($propDiameterMm in $config.propDiametersMm) {
      $propToken = Format-DiameterToken $propDiameterMm
      $fileName = "FanEnclosure_$($bottle.id)_M${motorToken}_P${propToken}.stl"
      $destPath = Join-Path -Path $destFolder -ChildPath $fileName

      if ((Test-Path $destPath) -and -not $Force) {
        Write-Host "Skipping $fileName (already exists, use -Force to regenerate)"
        $skipped++
        continue
      }

      Write-Host "Generating $fileName (motorDiameter=$motorDiameterMm, bottle=$($bottle.id))"
      # Plain `& $openscadExe ...` does NOT reliably block here - it can return before OpenSCAD
      # has actually finished writing the file (observed: call returns in ~10ms while the real
      # render takes several seconds), which silently breaks the exists-already skip check for
      # any two combos sharing a filename. Start-Process -Wait blocks on the real process handle
      # and avoids that race.
      $argList = @(
        "-o", $destPath,
        "--export-format", "binstl",
        "-D", "motorDiameter=$motorDiameterMm",
        "-D", "propDiameter=$propDiameterMm",
        "-D", "bottleDiameter=$($bottle.diameterMm)",
        $scadFile
      )
      $proc = Start-Process -FilePath $openscadExe -ArgumentList $argList -Wait -PassThru -NoNewWindow
      if ($proc.ExitCode -ne 0) {
        throw "openscad exited with code $($proc.ExitCode) for $fileName"
      }
      $generated++
    }
  }
}

Write-Host "Done. Generated $generated file(s), skipped $skipped existing file(s)."
Write-Host "Review new STLs, then map any you want the Configurator to use in docs/js/data/variants.js and re-run deployConfiguratorAssets.ps1."
