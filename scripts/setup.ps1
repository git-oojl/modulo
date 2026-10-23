[CmdletBinding()]
param(
    [switch]$InstallPrerequisites,
    [switch]$SkipPrerequisiteInstallation
)

$ErrorActionPreference = 'Stop'
# uv y otros comandos nativos pueden escribir estado normal en stderr.
# Sus codigos de salida se comprueban de forma explicita abajo.
$PSNativeCommandUseErrorActionPreference = $false
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

function Write-ReadinessResult {
    param(
        [bool]$Ready,
        [string]$Name,
        [string]$Detail,
        [string]$Fix
    )

    if ($Ready) {
        Write-Host "[OK] $Name - $Detail"
    } else {
        Write-Host "[NO] $Name - $Detail"
        if ($Fix) { Write-Host "     Solucion: $Fix" }
    }
    return $Ready
}

function Invoke-UvReadOnly {
    param([string]$Arguments)

    $uvExecutable = (Get-Command uv -ErrorAction Stop).Source
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $uvExecutable
    $startInfo.Arguments = $Arguments
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $standardOutput = $process.StandardOutput.ReadToEnd()
    $standardError = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    return [PSCustomObject]@{
        ExitCode = $process.ExitCode
        Output = "$standardOutput`n$standardError"
    }
}

function Test-UvEnvironment {
    param([string]$PythonVersion)

    $result = Invoke-UvReadOnly "sync --frozen --check --python $PythonVersion"
    return $result.ExitCode -eq 0
}

function Test-ModuloReadiness {
    $isReady = $true
    $expectedNode = $null
    $expectedNpm = $null
    $pythonVersion = $null
    $frontendReady = $false
    $backendReady = $false
    $databaseReady = $false

    Write-Host ''
    Write-Host 'Herramientas'

    if (Test-Command 'volta') {
        $voltaVersion = (& volta --version 2>$null | Out-String).Trim()
        if (-not (Write-ReadinessResult $true 'Volta' "version $voltaVersion" '')) { $isReady = $false }
    } else {
        Write-ReadinessResult $false 'Volta' 'no esta instalado o no esta en PATH' 'Elige [2] para instalarlo.' | Out-Null
        $isReady = $false
    }

    if (Test-Command 'uv') {
        $uvVersion = (& uv --version 2>$null | Out-String).Trim()
        Write-ReadinessResult $true 'uv' $uvVersion '' | Out-Null
    } else {
        Write-ReadinessResult $false 'uv' 'no esta instalado o no esta en PATH' 'Elige [2] para instalarlo.' | Out-Null
        $isReady = $false
    }

    Write-Host ''
    Write-Host 'Frontend'
    try {
        $frontendPackage = Get-Content (Join-Path $frontendPath 'package.json') -Raw | ConvertFrom-Json
        $expectedNode = "v$($frontendPackage.volta.node)"
        $expectedNpm = "$($frontendPackage.volta.npm)"
        Write-ReadinessResult $true 'Pines de frontend' "Node $expectedNode, npm $expectedNpm" '' | Out-Null
    } catch {
        Write-ReadinessResult $false 'frontend/package.json' 'no se pudo leer los pines de Volta' 'Restaura frontend/package.json desde Git.' | Out-Null
        $isReady = $false
    }

    if ((Test-Command 'volta') -and $expectedNode -and $expectedNpm) {
        Push-Location $frontendPath
        try {
            $nodePath = (& volta which node 2>$null | Out-String).Trim()
            if ($LASTEXITCODE -ne 0 -or -not $nodePath) {
                Write-ReadinessResult $false 'Node de Volta' 'la version fijada por el proyecto no esta descargada' 'Elige [1] para ejecutar volta fetch y npm ci.' | Out-Null
                $isReady = $false
            } else {
                $nodeVersion = (& node --version 2>$null | Out-String).Trim()
                $nodeReady = $LASTEXITCODE -eq 0 -and $nodeVersion -eq $expectedNode
                Write-ReadinessResult $nodeReady 'Node de Modulo' "esperado $expectedNode; activo $nodeVersion" 'Revisa el PATH o ejecuta [1].' | Out-Null
                if (-not $nodeReady) { $isReady = $false }
            }

            $npmPath = (& volta which npm 2>$null | Out-String).Trim()
            if ($LASTEXITCODE -ne 0 -or -not $npmPath) {
                Write-ReadinessResult $false 'npm de Volta' 'la version fijada por el proyecto no esta descargada' 'Elige [1] para ejecutar volta fetch y npm ci.' | Out-Null
                $isReady = $false
            } else {
                $npmVersion = (& npm --version 2>$null | Out-String).Trim()
                $npmReady = $LASTEXITCODE -eq 0 -and $npmVersion -eq $expectedNpm
                Write-ReadinessResult $npmReady 'npm de Modulo' "esperado $expectedNpm; activo $npmVersion" 'Revisa el PATH o ejecuta [1].' | Out-Null
                if (-not $npmReady) { $isReady = $false }
            }

            if ((Test-Path (Join-Path $frontendPath 'node_modules')) -and $nodeReady -and $npmReady) {
                npm ls --depth=0 --ignore-scripts *> $null
                $frontendReady = $LASTEXITCODE -eq 0
                Write-ReadinessResult $frontendReady 'Dependencias frontend' 'node_modules coincide con package-lock.json' 'Ejecuta [1] para aplicar npm ci.' | Out-Null
            } else {
                Write-ReadinessResult $false 'Dependencias frontend' 'node_modules no esta preparado' 'Ejecuta [1] para aplicar npm ci.' | Out-Null
                $frontendReady = $false
            }
            if (-not $frontendReady) { $isReady = $false }
        } finally {
            Pop-Location
        }
    } else {
        Write-ReadinessResult $false 'Runtime frontend' 'no se puede validar sin Volta y los pines del proyecto' 'Instala Volta y ejecuta [1].' | Out-Null
        $isReady = $false
    }

    Write-Host ''
    Write-Host 'Backend'
    $pythonVersionFile = Join-Path $backendPath '.python-version'
    if (Test-Path $pythonVersionFile) {
        $pythonVersion = (Get-Content $pythonVersionFile -Raw).Trim()
        $pythonVersionReady = -not [string]::IsNullOrWhiteSpace($pythonVersion)
        Write-ReadinessResult $pythonVersionReady 'Python requerido' $pythonVersion 'Restaura backend/.python-version desde Git.' | Out-Null
        if (-not $pythonVersionReady) { $isReady = $false }
    } else {
        Write-ReadinessResult $false 'Python requerido' 'falta backend/.python-version' 'Restaura backend/.python-version desde Git.' | Out-Null
        $isReady = $false
    }

    if ((Test-Command 'uv') -and $pythonVersion) {
        $pythonPath = (& uv python find $pythonVersion 2>$null | Out-String).Trim()
        $pythonReady = $LASTEXITCODE -eq 0 -and $pythonPath
        Write-ReadinessResult $pythonReady 'Python de uv' "requerido $pythonVersion" 'Elige [1] para instalar el Python declarado.' | Out-Null
        if (-not $pythonReady) { $isReady = $false }

        Push-Location $backendPath
        try {
            $backendReady = Test-UvEnvironment $pythonVersion
            $backendDetail = if ($backendReady) { 'uv.lock esta sincronizado con el entorno local' } else { 'falta .venv o no coincide con uv.lock' }
            Write-ReadinessResult $backendReady 'Dependencias backend' $backendDetail 'Elige [1] para ejecutar uv sync --frozen.' | Out-Null
            if (-not $backendReady) { $isReady = $false }
        } finally {
            Pop-Location
        }
    } else {
        Write-ReadinessResult $false 'Entorno backend' 'no se puede validar sin uv y la version de Python requerida' 'Instala uv y ejecuta [1].' | Out-Null
        $isReady = $false
    }

    $envFile = Join-Path $backendPath '.env'
    $envReady = Test-Path $envFile
    $envDetail = if ($envReady) { 'backend/.env existe' } else { 'falta backend/.env' }
    Write-ReadinessResult $envReady 'Configuracion backend' $envDetail 'Elige [1] para crear backend/.env desde .env.example.' | Out-Null
    if (-not $envReady) { $isReady = $false }

    Write-Host ''
    Write-Host 'Base de datos'
    if (-not (Test-Command 'docker')) {
        Write-ReadinessResult $false 'Docker' 'no esta instalado o no esta en PATH' 'Elige [2] para instalar Docker Desktop.' | Out-Null
        $isReady = $false
    } else {
        $dockerVersion = (& docker --version 2>$null | Out-String).Trim()
        Write-ReadinessResult $true 'Docker' $dockerVersion '' | Out-Null

        docker compose version *> $null
        $composeReady = $LASTEXITCODE -eq 0
        Write-ReadinessResult $composeReady 'Docker Compose' 'comando docker compose disponible' 'Actualiza Docker Desktop o instala el plugin de Compose.' | Out-Null
        if (-not $composeReady) { $isReady = $false }

        docker info *> $null
        $daemonReady = $LASTEXITCODE -eq 0
        Write-ReadinessResult $daemonReady 'Motor Docker' 'Docker Desktop o Docker Engine responde' 'Inicia Docker Desktop o el servicio Docker.' | Out-Null
        if (-not $daemonReady) { $isReady = $false }

        if ($composeReady -and $daemonReady) {
            docker compose -f $composeFile config --quiet *> $null
            $composeConfigReady = $LASTEXITCODE -eq 0
            Write-ReadinessResult $composeConfigReady 'Configuracion Compose' 'infra/compose.yaml es valido' 'Revisa infra/compose.yaml.' | Out-Null
            if (-not $composeConfigReady) { $isReady = $false }

            $dbStatus = (& docker compose -f $composeFile ps db --format json 2>$null | Out-String).Trim()
            if ($LASTEXITCODE -ne 0 -or -not $dbStatus) {
                Write-ReadinessResult $false 'PostgreSQL de Modulo' 'el contenedor no esta creado o no esta ejecutandose' 'Elige [1] para ejecutar docker compose up -d --wait.' | Out-Null
                $isReady = $false
            } else {
                try {
                    $db = $dbStatus | ConvertFrom-Json
                    $databaseReady = $db.State -eq 'running' -and $db.Health -eq 'healthy'
                    $databaseDetail = "estado $($db.State); salud $($db.Health)"
                    Write-ReadinessResult $databaseReady 'PostgreSQL de Modulo' $databaseDetail 'Elige [1] para iniciar PostgreSQL y espera a que este saludable.' | Out-Null
                    if (-not $databaseReady) { $isReady = $false }
                } catch {
                    Write-ReadinessResult $false 'PostgreSQL de Modulo' 'no se pudo interpretar el estado del contenedor' 'Ejecuta docker compose -f infra/compose.yaml ps.' | Out-Null
                    $isReady = $false
                }
            }
        }
    }

    Write-Host ''
    Write-Host 'Modulo'
    if ($backendReady -and $envReady -and $databaseReady) {
        Push-Location $backendPath
        try {
            $migrationResult = Invoke-UvReadOnly 'run --frozen --no-sync --env-file .env python manage.py showmigrations --plan'
            $migrationsReady = $migrationResult.ExitCode -eq 0 -and -not ($migrationResult.Output -match '\[ \]')
            Write-ReadinessResult $migrationsReady 'Migraciones Django' 'todas las migraciones estan aplicadas' 'Elige [1] para aplicar las migraciones pendientes.' | Out-Null
            if (-not $migrationsReady) { $isReady = $false }

            $djangoResult = Invoke-UvReadOnly 'run --frozen --no-sync --env-file .env python manage.py check'
            $djangoReady = $djangoResult.ExitCode -eq 0
            Write-ReadinessResult $djangoReady 'Validacion Django' 'manage.py check termino correctamente' 'Revisa la salida de: uv run --frozen --env-file .env python manage.py check' | Out-Null
            if (-not $djangoReady) { $isReady = $false }
        } finally {
            Pop-Location
        }
    } else {
        Write-ReadinessResult $false 'Validacion de Modulo' 'faltan dependencias del backend, configuracion o PostgreSQL' 'Corrige los elementos marcados como [NO] y ejecuta [1].' | Out-Null
        $isReady = $false
    }

    Write-Host ''
    if ($isReady) {
        Write-Host '[OK] Modulo esta listo para desarrollar.'
    } else {
        Write-Host '[NO] Modulo aun no esta listo. Corrige los elementos marcados y vuelve a ejecutar [3].'
    }
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
    if (-not (Test-ModuloReadiness)) { exit 1 }
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
    # Volta ejecuta las versiones fijadas en frontend/package.json sin depender del orden de PATH.
    $package = Get-Content (Join-Path $frontendPath 'package.json') -Raw | ConvertFrom-Json
    $expectedNode = "v$($package.volta.node)"
    $expectedNpm = $package.volta.npm
    volta fetch "node@$($package.volta.node)" "npm@$expectedNpm"
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo descargar las versiones declaradas de Node.js y npm.' }
    $nodeVersion = (volta run --node $package.volta.node --npm $expectedNpm -- node --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo ejecutar la version declarada de Node.js.' }
    $npmVersion = (volta run --node $package.volta.node --npm $expectedNpm -- npm --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo ejecutar la version declarada de npm.' }
    if ($nodeVersion -ne $expectedNode -or $npmVersion -ne $expectedNpm) {
        throw "Volta debe aplicar Node $expectedNode y npm $expectedNpm segun frontend/package.json."
    }
    volta run --node $package.volta.node --npm $expectedNpm -- npm ci
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
