param(
  [ValidateSet('setup', 'fetch', 'check', 'dev', 'build')]
  [string]$Task = 'dev',
  [switch]$NoMirror
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$CargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$MsysRoot = 'C:\msys64'
$MingwBin = Join-Path $MsysRoot 'mingw64\bin'
$Pacman = Join-Path $MsysRoot 'usr\bin\pacman.exe'
$Target = 'x86_64-pc-windows-gnu'
$Toolchain = 'stable-x86_64-pc-windows-gnu'
$CargoMirrorConfig = Join-Path $env:TEMP 'daily-plan-cargo-ustc-config.toml'
$CargoTargetDir = Join-Path $env:LOCALAPPDATA 'daily-plan-review\cargo-target-gnu'
$AsciiIconPath = Join-Path $CargoTargetDir 'icon.ico'

function Add-PathEntry([string]$PathEntry) {
  if (-not ($env:Path -split ';' | Where-Object { $_ -ieq $PathEntry })) {
    $env:Path = "$PathEntry;$env:Path"
  }
}

function Enable-CargoMirror {
  if ($NoMirror) {
    return
  }

  $env:RUSTUP_DIST_SERVER = 'https://mirrors.ustc.edu.cn/rust-static'
  $env:CARGO_SOURCE_CRATES_IO_REPLACE_WITH = 'ustc'
  $env:CARGO_SOURCE_USTC_REGISTRY = 'sparse+https://mirrors.ustc.edu.cn/crates.io-index/'
}

function Invoke-NativeCommand([string]$FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
}

function Get-CargoMirrorArgs {
  if ($NoMirror) {
    return @()
  }

  @'
[source.crates-io]
replace-with = "ustc"

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
'@ | Set-Content -LiteralPath $CargoMirrorConfig -Encoding utf8

  return @('--config', $CargoMirrorConfig)
}

function Use-WindowsGnuEnv {
  Add-PathEntry $CargoBin
  Add-PathEntry $MingwBin
  Enable-CargoMirror

  $env:RUSTUP_TOOLCHAIN = $Toolchain
  $env:CARGO_BUILD_TARGET = $Target
  $env:CARGO_TARGET_DIR = $CargoTargetDir
  $env:CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER = 'clang'
  $env:RUSTFLAGS = '-C link-arg=-fuse-ld=lld'
  $env:CC_x86_64_pc_windows_gnu = 'clang'
  New-Item -ItemType Directory -Force -Path $CargoTargetDir | Out-Null

  $sourceIconPath = Join-Path $RepoRoot 'src-tauri\icons\icon.ico'
  if (Test-Path -LiteralPath $sourceIconPath) {
    Copy-Item -LiteralPath $sourceIconPath -Destination $AsciiIconPath -Force
    $env:TAURI_CONFIG = @{ bundle = @{ icon = @($AsciiIconPath) } } | ConvertTo-Json -Compress
  }
}

function Install-WindowsGnuToolchain {
  Add-PathEntry $CargoBin
  Enable-CargoMirror

  if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
    throw "rustup not found. Install Rust first, then re-run this script."
  }

  Invoke-NativeCommand 'rustup' @('toolchain', 'install', $Toolchain, '--profile', 'minimal')
  Invoke-NativeCommand 'rustup' @('target', 'add', $Target, '--toolchain', $Toolchain)

  if (-not (Test-Path -LiteralPath $Pacman)) {
    Invoke-NativeCommand 'winget' @('install', '--id', 'MSYS2.MSYS2', '--exact', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements', '--silent')
  }

  Invoke-NativeCommand $Pacman @('-S', '--needed', '--noconfirm', 'mingw-w64-x86_64-gcc', 'mingw-w64-x86_64-binutils', 'mingw-w64-x86_64-clang', 'mingw-w64-x86_64-lld')
}

function Assert-WindowsGnuToolchain {
  Use-WindowsGnuEnv

  foreach ($command in @('cargo', 'rustc', 'clang', 'ld.lld', 'windres')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "$command not found. Run: npm run setup:windows-gnu"
    }
  }

  $installedTargets = rustup target list --installed --toolchain $Toolchain
  if ($LASTEXITCODE -ne 0) {
    throw "rustup target list failed"
  }

  if ($installedTargets -notcontains $Target) {
    throw "$Target not installed. Run: npm run setup:windows-gnu"
  }

  rustup run $Toolchain cargo --version | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "$Toolchain not installed. Run: npm run setup:windows-gnu"
  }
}

function Invoke-CargoFetch {
  $cargoArgs = @('fetch', '--locked') + (Get-CargoMirrorArgs)
  Invoke-NativeCommand 'cargo' $cargoArgs
}

function Invoke-CargoCheck {
  $cargoArgs = @('check', '--target', $Target, '--no-default-features') + (Get-CargoMirrorArgs)
  Invoke-NativeCommand 'cargo' $cargoArgs
}

switch ($Task) {
  'setup' {
    Install-WindowsGnuToolchain
  }
  'fetch' {
    Assert-WindowsGnuToolchain
    Push-Location (Join-Path $RepoRoot 'src-tauri')
    try {
      Invoke-CargoFetch
    } finally {
      Pop-Location
    }
  }
  'check' {
    Assert-WindowsGnuToolchain
    Push-Location (Join-Path $RepoRoot 'src-tauri')
    try {
      Invoke-CargoFetch
      Invoke-CargoCheck
    } finally {
      Pop-Location
    }
  }
  'dev' {
    Assert-WindowsGnuToolchain
    Push-Location (Join-Path $RepoRoot 'src-tauri')
    try {
      Invoke-CargoFetch
    } finally {
      Pop-Location
    }

    Push-Location $RepoRoot
    try {
      Invoke-NativeCommand 'npm.cmd' @('run', 'tauri', '--', 'dev', '--target', $Target)
    } finally {
      Pop-Location
    }
  }
  'build' {
    Assert-WindowsGnuToolchain
    Push-Location (Join-Path $RepoRoot 'src-tauri')
    try {
      Invoke-CargoFetch
    } finally {
      Pop-Location
    }

    Push-Location $RepoRoot
    try {
      Invoke-NativeCommand 'npm.cmd' @('run', 'tauri', '--', 'build', '--target', $Target)
    } finally {
      Pop-Location
    }
  }
}
