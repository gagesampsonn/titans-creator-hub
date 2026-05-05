<#
.SYNOPSIS
  Regenerates assets/community-wins/manifest.json for the homepage "Community wins feed".

.DESCRIPTION
  Scans assets/community-wins for files named win-* (jpg/png/gif/webp), sorts by name,
  and writes a JSON array of paths like "assets/community-wins/win-0001.jpg".

  Your Desktop folder name does not matter for the live site—only files inside
  assets/community-wins are published. Keep any local name you like for the drop folder.

.PARAMETER ImportFrom
  Optional. If set, DELETES existing win-*.* files in assets/community-wins, then copies
  all supported images from this folder (sorted by filename) and renumbers them as
  win-0001.ext, win-0002.ext, ... Finally writes manifest.json.

  Use this when you refresh wins from e.g. "Titans creators Wins" on the Desktop.

.PARAMETER RepoRoot
  Path to the titans-creator-hub repo root. Default: parent of the scripts/ folder.

.EXAMPLE
  .\scripts\update-community-wins-manifest.ps1

.EXAMPLE
  .\scripts\update-community-wins-manifest.ps1 -ImportFrom "$env:USERPROFILE\OneDrive\Desktop\Titans creators Wins"
#>
param(
  [string]$ImportFrom = "",
  [string]$RepoRoot = ""
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$dest = Join-Path $RepoRoot "assets\community-wins"
$allowedExt = @(".jpg", ".jpeg", ".png", ".gif", ".webp")

if ($ImportFrom) {
  if (-not (Test-Path -LiteralPath $ImportFrom)) {
    Write-Error "ImportFrom path not found: $ImportFrom"
  }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Get-ChildItem -LiteralPath $dest -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "win-*" } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

  $n = 0
  Get-ChildItem -LiteralPath $ImportFrom -File | Sort-Object Name | ForEach-Object {
    $ext = $_.Extension.ToLower()
    if ($allowedExt -notcontains $ext) { return }
    $n++
    $target = Join-Path $dest ("win-{0:D4}{1}" -f $n, $ext)
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
  Write-Host "Imported $n image(s) into $dest"
}

if (-not (Test-Path -LiteralPath $dest)) {
  Write-Error "Community wins folder missing: $dest (create it or run with -ImportFrom)"
}

$relativePaths = Get-ChildItem -LiteralPath $dest -File |
  Where-Object { $_.Name -ne "manifest.json" -and $_.Name -like "win-*" } |
  Sort-Object Name |
  ForEach-Object { "assets/community-wins/$($_.Name)" }

$manifestPath = Join-Path $dest "manifest.json"
$relativePaths | ConvertTo-Json -Compress | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "Wrote $($relativePaths.Count) path(s) to $manifestPath"
