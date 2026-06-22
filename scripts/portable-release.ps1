param(
  [string]$Version = '0.2.0'
)

$ErrorActionPreference = 'Stop'

if ($Version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') {
  throw "Version must use a safe semantic version format, for example 0.2.0"
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CargoTargetDir = Join-Path $env:LOCALAPPDATA 'daily-plan-review\cargo-target-gnu'
$Target = 'x86_64-pc-windows-gnu'
$ReleaseDir = Join-Path $CargoTargetDir "$Target\release"
$ExePath = Join-Path $ReleaseDir 'daily-plan-review.exe'
$PortableRoot = Join-Path $RepoRoot 'dist-portable'

function ConvertFrom-CodePoints([int[]]$CodePoints) {
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}

$AppDisplayName = ConvertFrom-CodePoints @(0x6BCF, 0x65E5, 0x8BA1, 0x5212, 0x4E0E, 0x590D, 0x76D8)
$QuickStartFileName = "$(ConvertFrom-CodePoints @(0x5FEB, 0x901F, 0x5F00, 0x59CB)).txt"
$StagingDir = Join-Path $PortableRoot "$AppDisplayName-v$Version-portable"
$ZipPath = Join-Path $PortableRoot "$AppDisplayName-v$Version-portable.zip"

function Assert-ChildPath([string]$Parent, [string]$Child) {
  $parentFullPath = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
  $childFullPath = [System.IO.Path]::GetFullPath($Child)

  if (-not $childFullPath.StartsWith($parentFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside portable output directory: $Child"
  }
}

npm.cmd run tauri:build:gnu
if ($LASTEXITCODE -ne 0) {
  throw "tauri:build:gnu failed"
}

if (-not (Test-Path -LiteralPath $ExePath)) {
  throw "Release executable not found: $ExePath"
}

New-Item -ItemType Directory -Force -Path $PortableRoot | Out-Null
Assert-ChildPath $PortableRoot $StagingDir
Assert-ChildPath $PortableRoot $ZipPath

if (Test-Path -LiteralPath $StagingDir) {
  Remove-Item -LiteralPath $StagingDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $StagingDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StagingDir 'data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StagingDir 'docs') | Out-Null
Copy-Item -LiteralPath $ExePath -Destination (Join-Path $StagingDir "$AppDisplayName.exe") -Force
Get-ChildItem -LiteralPath $ReleaseDir -Filter '*.dll' | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $StagingDir -Force
}
Copy-Item -LiteralPath (Join-Path (Join-Path $RepoRoot 'docs') $QuickStartFileName) -Destination (Join-Path (Join-Path $StagingDir 'docs') $QuickStartFileName) -Force

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -LiteralPath $StagingDir -DestinationPath $ZipPath -Force
Write-Host "Portable package created: $ZipPath"
