[CmdletBinding()]
param(
    [switch]$InstallPrerequisites
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repositoryRoot 'frontend'
$backendPath = Join-Path $repositoryRoot 'backend'
$composeFile = Join-Path $repositoryRoot 'infra/compose.yaml'

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Require-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Test-Command $Name)) {
        throw "$Name no está disponible. $Hint"
    }
}

function Add-UserPathEntry {
    param([string]$Entry)

    if (-not (Test-Path $Entry)) {
        Write-Warning "No se encontró $Entry; no se modificó PATH."
        return
    }

    $normalizedEntry = $Entry.TrimEnd('\')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($userPath -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $remainingEntries = @($entries | Where-Object { -not $_.TrimEnd('\').Equals($normalizedEntry, [StringComparison]::OrdinalIgnoreCase) })
    [Environment]::SetEnvironmentVariable('Path', ((@($normalizedEntry) + $remainingEntries) -join ';'), 'User')

    $processEntries = @($env:Path -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if (-not ($processEntries | Where-Object { $_.TrimEnd('\').Equals($normalizedEntry, [StringComparison]::OrdinalIgnoreCase) })) {
        $env:Path = "$normalizedEntry;$env:Path"
    }
}

function Configure-ManagedToolchains {
    $voltaBin = Join-Path $env:LOCALAPPDATA 'Volta\bin'
    Add-UserPathEntry $voltaBin
    [Environment]::SetEnvironmentVariable('UV_MANAGED_PYTHON', 'true', 'User')
    $env:UV_MANAGED_PYTHON = 'true'
    Write-Host 'Volta queda al inicio del PATH de usuario y uv usará Python administrado por uv en nuevas terminales.'
}

function Install-MissingPrerequisites {
    $packages = @(
        @{ Command = 'volta'; Id = 'Volta.Volta'; Name = 'Volta' },
        @{ Command = 'uv'; Id = 'astral-sh.uv'; Name = 'uv' },
        @{ Command = 'docker'; Id = 'Docker.DockerDesktop'; Name = 'Docker Desktop' }
    )

    $missing = @($packages | Where-Object { -not (Test-Command $_.Command) })
    if ($missing.Count -eq 0) {
        Write-Host 'Volta, uv y Docker ya están disponibles; no se instalará ni actualizará nada.'
        return $false
    }

    Require-Command 'winget' 'Instala las herramientas manualmente: docs/INSTALACION_HERRAMIENTAS.md'
    foreach ($package in $missing) {
        Write-Host "Instalando $($package.Name) con WinGet..."
        winget install --id $package.Id --exact --source winget --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar $($package.Name) con WinGet." }
    }

    return $true
}

if ($InstallPrerequisites) {
    $installedPrerequisites = Install-MissingPrerequisites
    Configure-ManagedToolchains
    if ($installedPrerequisites) {
        Write-Host 'Se instalaron herramientas. Abre una terminal nueva, inicia Docker Desktop si se instaló y vuelve a ejecutar este script sin parámetros.'
        exit 0
    }
}

Require-Command 'volta' 'Instala Volta: https://volta.sh/'
Require-Command 'uv' 'Instala uv: https://docs.astral.sh/uv/'
Require-Command 'docker' 'Instala Docker con Compose: https://docs.docker.com/get-docker/'

docker compose version
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose no está disponible.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker está instalado, pero el motor no está disponible. Inicia Docker Desktop o el servicio Docker y vuelve a intentarlo.' }

$envFile = Join-Path $backendPath '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendPath '.env.example') $envFile
    Write-Host 'Creado backend/.env para desarrollo.'
}

Push-Location $backendPath
try {
    $pythonVersion = (Get-Content (Join-Path $backendPath '.python-version') -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pythonVersion)) { throw 'backend/.python-version no contiene una versión de Python.' }
    uv python install $pythonVersion
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Python con uv.' }
    uv sync --frozen --python $pythonVersion
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron sincronizar las dependencias Python.' }
} finally {
    Pop-Location
}

Push-Location $frontendPath
try {
    # Volta lee las versiones fijadas en frontend/package.json al invocar node/npm.
    $package = Get-Content (Join-Path $frontendPath 'package.json') -Raw | ConvertFrom-Json
    $expectedNode = "v$($package.volta.node)"
    $expectedNpm = $package.volta.npm
    volta fetch "node@$($package.volta.node)" "npm@$expectedNpm"
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo descargar las versiones declaradas de Node.js y npm.' }
    $nodeVersion = (node --version).Trim()
    $npmVersion = (npm --version).Trim()
    if ($nodeVersion -ne $expectedNode -or $npmVersion -ne $expectedNpm) {
        throw "Volta debe aplicar Node $expectedNode y npm $expectedNpm según frontend/package.json. Revisa las herramientas y el PATH."
    }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias Angular.' }
} finally {
    Pop-Location
}

Push-Location $repositoryRoot
try {
    docker compose -f $composeFile up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL con Docker Compose.' }
} finally {
    Pop-Location
}

Push-Location $backendPath
try {
    uv run --frozen --env-file .env python manage.py migrate
    if ($LASTEXITCODE -ne 0) { throw 'Falló la aplicación de migraciones.' }
    uv run --frozen --env-file .env python manage.py check
    if ($LASTEXITCODE -ne 0) { throw 'Falló la validación de Django.' }
} finally {
    Pop-Location
}

Write-Host 'Modulo preparado.'
Write-Host 'Backend:  cd backend; uv run --frozen --env-file .env python manage.py runserver'
Write-Host 'Frontend: cd frontend; npm start'
