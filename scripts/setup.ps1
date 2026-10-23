[CmdletBinding()]
param(
    [switch]$InstallPrerequisites,
    [switch]$SkipPrerequisiteInstallation
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
        throw "$Name no esta disponible. $Hint"
    }
}

function Add-UserPathEntry {
    param([string]$Entry)

    if (-not (Test-Path $Entry)) {
        Write-Warning "No se encontro $Entry; no se modifico PATH."
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
    Write-Host 'Volta queda al inicio del PATH de usuario y uv usara Python administrado por uv en nuevas terminales.'
}

function Add-ProcessPathEntry {
    param([string]$Entry)

    if (-not (Test-Path $Entry)) { return }
    $normalizedEntry = $Entry.TrimEnd('\')
    $processEntries = @($env:Path -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if (-not ($processEntries | Where-Object { $_.TrimEnd('\').Equals($normalizedEntry, [StringComparison]::OrdinalIgnoreCase) })) {
        $env:Path = "$normalizedEntry;$env:Path"
    }
}

function Refresh-ProcessToolPath {
    Add-ProcessPathEntry (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links')
    Add-ProcessPathEntry (Join-Path $env:ProgramFiles 'Volta')
    Add-ProcessPathEntry (Join-Path $env:LOCALAPPDATA 'Volta\bin')
    Add-ProcessPathEntry (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin')
}

function Install-MissingPrerequisites {
    $packages = @(
        @{ Command = 'volta'; Id = 'Volta.Volta'; Name = 'Volta' },
        @{ Command = 'uv'; Id = 'astral-sh.uv'; Name = 'uv' },
        @{ Command = 'docker'; Id = 'Docker.DockerDesktop'; Name = 'Docker Desktop' }
    )

    $missing = @($packages | Where-Object { -not (Test-Command $_.Command) })
    if ($missing.Count -eq 0) {
        Write-Host 'Volta, uv y Docker ya estan disponibles; no se instalara ni actualizara nada.'
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

function Get-PreparationChoice {
    while ($true) {
        Write-Host ''
        Write-Host 'Preparacion de herramientas:'
        Write-Host '  [1] Preparar entorno de Modulo'
        Write-Host '  [2] Instalar herramientas faltantes y configurar Volta/uv para este usuario'
        Write-Host '  [3] Comprobar dependencias instaladas'
        Write-Host '  [0] Salir sin modificar el equipo'
        $choice = (Read-Host 'Elige 1, 2, 3 o 0').Trim()
        switch ($choice) {
            '1' { return 'Prepare' }
            '2' { return 'Install' }
            '3' { return 'Check' }
            '0' { return 'Stop' }
            default { Write-Warning 'Respuesta no valida. Escribe 1, 2, 3 o 0.' }
        }
    }
}

function Confirm-PreparationChoice {
    param([string]$Description)

    while ($true) {
        $confirmation = (Read-Host "Elegiste: $Description. Confirmas? [Y/n]").Trim().ToUpperInvariant()
        switch ($confirmation) {
            '' { return $true }
            'Y' { return $true }
            'N' { return $false }
            default { Write-Warning 'Respuesta no valida. Escribe Y o N.' }
        }
    }
}

function Test-Prerequisites {
    $isReady = $true
    foreach ($tool in @('volta', 'uv', 'docker')) {
        if (Test-Command $tool) {
            Write-Host "${tool}: OK"
        } else {
            Write-Host "${tool}: falta"
            $isReady = $false
        }
    }

    if (Test-Command 'docker') {
        docker compose version *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'docker compose: OK'
        } else {
            Write-Host 'docker compose: falta'
            $isReady = $false
        }

        docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'motor Docker: OK'
        } else {
            Write-Host 'motor Docker: no disponible'
            $isReady = $false
        }
    }

    if ($isReady) { Write-Host 'Dependencias: OK.' }
    return $isReady
}

if ($InstallPrerequisites -and $SkipPrerequisiteInstallation) {
    throw 'No se pueden usar -InstallPrerequisites y -SkipPrerequisiteInstallation al mismo tiempo.'
}

if ($InstallPrerequisites) {
    $preparationChoice = 'Install'
    $choiceDescription = 'instalar herramientas faltantes, configurar Volta/uv y preparar Modulo'
} elseif ($SkipPrerequisiteInstallation) {
    $preparationChoice = 'Prepare'
    $choiceDescription = 'preparar Modulo con las herramientas instaladas, sin cambiar la configuracion del usuario'
} else {
    $preparationChoice = Get-PreparationChoice
}

if ($preparationChoice -eq 'Check') {
    if (-not (Test-Prerequisites)) { exit 1 }
    exit 0
}

if ($preparationChoice -eq 'Stop') {
    Write-Host 'Preparacion cancelada.'
    exit 0
}

$choiceDescription = if ($preparationChoice -eq 'Install') {
    'instalar herramientas faltantes, configurar Volta/uv y preparar Modulo'
} else {
    'preparar el entorno de Modulo con las herramientas instaladas'
}

if (-not (Confirm-PreparationChoice $choiceDescription)) {
    Write-Host 'No se realizo ninguna accion.'
    exit 0
}

switch ($preparationChoice) {
    'Install' {
    $installedPrerequisites = Install-MissingPrerequisites
    Configure-ManagedToolchains
    Refresh-ProcessToolPath
    if ($installedPrerequisites) {
        Write-Host 'Se instalaron herramientas faltantes; el script continuara con la preparacion de Modulo.'
    }
    }
    'Prepare' { Write-Host 'Se usaran las herramientas disponibles sin modificar la configuracion del usuario.' }
}

Require-Command 'volta' 'Instala Volta: https://volta.sh/'
Require-Command 'uv' 'Instala uv: https://docs.astral.sh/uv/'
Require-Command 'docker' 'Instala Docker con Compose: https://docs.docker.com/get-docker/'

docker compose version
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose no esta disponible.' }

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker esta instalado, pero el motor no esta disponible. Inicia Docker Desktop o el servicio Docker y vuelve a ejecutar el script.' }

$envFile = Join-Path $backendPath '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendPath '.env.example') $envFile
    Write-Host 'Creado backend/.env para desarrollo.'
}

Push-Location $backendPath
try {
    $pythonVersion = (Get-Content (Join-Path $backendPath '.python-version') -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pythonVersion)) { throw 'backend/.python-version no contiene una version de Python.' }
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
        throw "Volta debe aplicar Node $expectedNode y npm $expectedNpm segun frontend/package.json. Revisa las herramientas y el PATH."
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
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la aplicacion de migraciones.' }
    uv run --frozen --env-file .env python manage.py check
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la validacion de Django.' }
} finally {
    Pop-Location
}

Write-Host 'Modulo preparado.'
Write-Host 'Backend:  cd backend; uv run --frozen --env-file .env python manage.py runserver'
Write-Host 'Frontend: cd frontend; npm start'
