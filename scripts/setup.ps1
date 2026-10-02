[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repositoryRoot 'frontend'
$backendPath = Join-Path $repositoryRoot 'backend'
$expectedNodeVersion = 'v22.23.3'
$expectedNpmVersion = '10.9.9'
$expectedPythonVersion = '3.12.14'

function Require-Command {
  param([string]$Name, [string]$InstallHint)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "$Name no está instalado. $InstallHint"
  }
}

Require-Command 'volta' 'Instálalo desde https://volta.sh/ y vuelve a ejecutar este script.'
Require-Command 'uv' 'Instálalo desde https://docs.astral.sh/uv/ y vuelve a ejecutar este script.'

if (Get-Command 'psql' -ErrorAction SilentlyContinue) {
  $postgresVersion = (& psql --version 2>$null)
  if ($postgresVersion -match '17\.') {
    Write-Host "PostgreSQL detectado: $postgresVersion"
  } else {
    Write-Warning "Se detectó $postgresVersion. Modulo requiere PostgreSQL 17.x; instálalo o selecciona esa versión antes de ejecutar migraciones."
  }
} else {
  Write-Warning 'No se encontró psql. Instala PostgreSQL 17.x antes de ejecutar migraciones: https://www.postgresql.org/download/windows/'
}

Push-Location $frontendPath
try {
  $nodeVersion = (node --version).Trim()
  $npmVersion = (npm --version).Trim()

  if ($nodeVersion -ne $expectedNodeVersion -or $npmVersion -ne $expectedNpmVersion) {
    Write-Error "Volta no aplicó las versiones fijadas ($expectedNodeVersion / npm $expectedNpmVersion). Ejecuta 'volta install node@22.23.3 npm@10.9.9' y vuelve a intentar."
  }

  Write-Host "Instalando dependencias del frontend con Node $nodeVersion y npm $npmVersion..."
  npm ci
} finally {
  Pop-Location
}

Push-Location $backendPath
try {
  $env:UV_MANAGED_PYTHON = 'true'
  $managedPython = uv python find $expectedPythonVersion 2>$null
  if (-not $managedPython) {
    Write-Host "Instalando Python administrado por uv $expectedPythonVersion..."
    uv python install $expectedPythonVersion
  }

  Write-Host 'Sincronizando dependencias bloqueadas del backend...'
  uv sync --frozen
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Preparación terminada.'
Write-Host 'Frontend: cd frontend; npm start'
Write-Host 'Backend:  cd backend; Copy-Item .env.example .env; uv run python manage.py check'
