[CmdletBinding()]
param(
    [switch]$InstallPrerequisites,
    [switch]$SkipPrerequisiteInstallation
)

$ErrorActionPreference = 'Stop'
# uv y otros comandos nativos pueden escribir estado normal en stderr.
# Sus codigos de salida se comprueban de forma explicita abajo.
$PSNativeCommandUseErrorActionPreference = $false
if ($PSVersionTable.PSVersion.Major -lt 5) {
    throw 'scripts/setup.ps1 requiere Windows PowerShell 5.1 o PowerShell 7 o posterior.'
}
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

function Get-WinGetExecutable {
    # Invocar el alias de WindowsApps cuando App Installer falta abre el dialogo
    # generico de "Selecciona una aplicacion". Se prefiere el ejecutable real.
    if (Test-Command 'Get-AppxPackage') {
        $appInstaller = @(Get-AppxPackage -Name 'Microsoft.DesktopAppInstaller' -ErrorAction SilentlyContinue | Sort-Object Version -Descending)
        foreach ($package in $appInstaller) {
            if (-not $package.InstallLocation) { continue }
            $candidate = Join-Path $package.InstallLocation 'winget.exe'
            if (Test-Path $candidate) { return $candidate }
        }
    }

    $command = Get-Command 'winget.exe' -CommandType Application -ErrorAction SilentlyContinue
    if ($command -and $command.Source -and (Test-Path $command.Source) -and $command.Source -notlike '*\Microsoft\WindowsApps\*') {
        return $command.Source
    }
    return $null
}

function Require-WinGet {
    $winget = Get-WinGetExecutable
    if (-not $winget) {
        throw 'WinGet no esta disponible o el alias de WindowsApps esta roto. Instala o actualiza Microsoft App Installer desde Microsoft Store y vuelve a ejecutar el script; tambien puedes instalar las herramientas manualmente segun docs/INSTALACION_HERRAMIENTAS.md.'
    }
    return $winget
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
    Add-ProcessPathEntry (Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker\resources\bin')
    Add-ProcessPathEntry (Join-Path $env:LOCALAPPDATA 'Programs\Docker Desktop\resources\bin')
    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    if ($programFilesX86) {
        Add-ProcessPathEntry (Join-Path $programFilesX86 'Docker\Docker\resources\bin')
    }
}

function Get-DockerDesktopExecutable {
    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    $candidates = @(
        (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
        $(if ($programFilesX86) { Join-Path $programFilesX86 'Docker\Docker\Docker Desktop.exe' }),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker Desktop\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
    )
    return @($candidates | Where-Object { Test-Path $_ } | Select-Object -First 1)
}

function Get-DockerClientExecutable {
    $dockerCommand = Get-Command 'docker.exe' -CommandType Application -ErrorAction SilentlyContinue
    if ($dockerCommand -and $dockerCommand.Source -and (Test-Path $dockerCommand.Source)) {
        return $dockerCommand.Source
    }

    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    $candidates = @(
        (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe'),
        $(if ($programFilesX86) { Join-Path $programFilesX86 'Docker\Docker\resources\bin\docker.exe' }),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker\resources\bin\docker.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker Desktop\resources\bin\docker.exe')
    )
    return @($candidates | Where-Object { Test-Path $_ } | Select-Object -First 1)
}

function Test-DockerInstalled {
    return [bool](Get-DockerClientExecutable)
}

function Invoke-DockerCommand {
    param([string[]]$Arguments)

    $docker = Get-DockerClientExecutable
    if (-not $docker) {
        return [PSCustomObject]@{ ExitCode = 1; Output = 'No se encontro el cliente Docker.' }
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $docker
    $startInfo.Arguments = (($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') { '"' + $_.Replace('"', '\"') + '"' } else { $_ }
    }) -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $standardOutput = $process.StandardOutput.ReadToEnd()
    $standardError = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    return [PSCustomObject]@{
        ExitCode = $process.ExitCode
        Output = "$standardOutput$standardError".Trim()
    }
}

function Write-DockerCommandOutput {
    param($Result)
    if ($Result.Output) { Write-Host $Result.Output }
}

function Test-DockerComposeAvailable {
    $result = Invoke-DockerCommand -Arguments @('compose', 'version')
    return $result.ExitCode -eq 0
}

function Test-DockerToolingAvailable {
    return (Test-DockerInstalled) -and (Test-DockerComposeAvailable)
}

function Test-DockerDaemon {
    $result = Invoke-DockerCommand -Arguments @('info')
    return $result.ExitCode -eq 0
}

function Start-DockerDaemon {
    if (Test-DockerDaemon) { return $true }

    $dockerDesktop = Get-DockerDesktopExecutable
    if ($dockerDesktop) {
        Write-Host 'Docker Desktop no estaba iniciado; se iniciara y se esperara a que el motor este listo...'
        Start-Process -FilePath $dockerDesktop
    } else {
        $dockerService = Get-Service -Name 'docker' -ErrorAction SilentlyContinue
        if ($dockerService -and $dockerService.Status -ne 'Running') {
            try {
                Start-Service -Name 'docker' -ErrorAction Stop
                Write-Host 'Se inicio el servicio Docker.'
            } catch {
                Write-Warning 'No se pudo iniciar el servicio Docker. Si no usas Docker Desktop, inicia Docker Engine desde una consola con permisos de administrador.'
            }
        } else {
            return $false
        }
    }

    # Docker Desktop puede tardar en preparar WSL 2 despues de una instalacion o un reinicio.
    for ($attempt = 1; $attempt -le 45; $attempt++) {
        Start-Sleep -Seconds 2
        if (Test-DockerDaemon) { return $true }
    }
    return $false
}

function Install-MissingPrerequisites {
    $packages = @(
        @{ IsInstalled = { Test-Command 'volta' }; Id = 'Volta.Volta'; Name = 'Volta' },
        @{ IsInstalled = { Test-Command 'uv' }; Id = 'astral-sh.uv'; Name = 'uv' },
        # Docker puede venir de Desktop, MSI u otro Engine, pero el proyecto requiere Compose.
        @{ IsInstalled = { Test-DockerToolingAvailable }; Id = 'Docker.DockerDesktop'; Name = 'Docker Desktop con Compose' }
    )

    $missing = @($packages | Where-Object { -not (& $_.IsInstalled) })
    if ($missing.Count -eq 0) {
        Write-Host 'Volta, uv y Docker ya estan disponibles; no se instalara ni actualizara nada.'
        return $false
    }

    $winget = Require-WinGet
    foreach ($package in $missing) {
        Write-Host "Instalando $($package.Name) con WinGet..."
        & $winget install --id $package.Id --exact --source winget --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar $($package.Name) con WinGet." }
    }

    return $true
}

function Install-DockerDesktop {
    $winget = Require-WinGet
    Write-Host 'Instalando Docker Desktop con WinGet...'
    & $winget install --id 'Docker.DockerDesktop' --exact --source winget --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Docker Desktop con WinGet.' }
    Refresh-ProcessToolPath
    if (-not (Test-DockerToolingAvailable)) {
        throw 'WinGet termino, pero no se encontro Docker con Compose. Cierra y abre una terminal nueva o completa el instalador antes de reintentar.'
    }
    Write-Host '[OK] Docker Desktop esta instalado.'
}

function Get-PreparationChoice {
    while ($true) {
        Write-Host ''
        Write-Host 'Preparacion de herramientas:'
        Write-Host '  [1] Preparar entorno de Modulo'
        Write-Host '  [2] Instalacion completa: herramientas + entorno de Modulo'
        Write-Host '  [3] Comprobar dependencias instaladas'
        Write-Host '  [4] Iniciar solo Docker y PostgreSQL'
        Write-Host '  [0] Salir sin modificar el equipo'
        $choice = (Read-Host 'Elige 1, 2, 3, 4 o 0').Trim()
        switch ($choice) {
            '1' { return 'Prepare' }
            '2' { return 'Install' }
            '3' { return 'Check' }
            '4' { return 'Docker' }
            '0' { return 'Stop' }
            default { Write-Warning 'Respuesta no valida. Escribe 1, 2, 3, 4 o 0.' }
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

function Confirm-DockerStartup {
    while ($true) {
        $confirmation = (Read-Host 'Backend y frontend estan listos. Iniciar Docker y PostgreSQL ahora? [Y/n]').Trim().ToUpperInvariant()
        switch ($confirmation) {
            '' { return $true }
            'Y' { return $true }
            'N' { return $false }
            default { Write-Warning 'Respuesta no valida. Escribe Y o N.' }
        }
    }
}

function Confirm-DockerDesktopInstallation {
    while ($true) {
        $confirmation = (Read-Host 'Docker con Compose no esta disponible. Instalar Docker Desktop ahora con WinGet? [Y/n]').Trim().ToUpperInvariant()
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

function Write-ReadinessInfo {
    param([string]$Name, [string]$Detail, [string]$Action)
    Write-Host "[INFO] $Name - $Detail"
    if ($Action) { Write-Host "       Accion: $Action" }
}

function Get-WslStatus {
    $wslCommand = Get-Command 'wsl.exe' -ErrorAction SilentlyContinue
    if (-not $wslCommand) {
        return [PSCustomObject]@{ Available = $false; ExitCode = 1; Output = '' }
    }

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $wslCommand.Source
    $startInfo.Arguments = '--status'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.StandardOutputEncoding = [System.Text.Encoding]::Unicode
    $startInfo.StandardErrorEncoding = [System.Text.Encoding]::Unicode

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $output = $process.StandardOutput.ReadToEnd()
    $errorOutput = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    return [PSCustomObject]@{
        Available = $true
        ExitCode = $process.ExitCode
        Output = "$output`n$errorOutput"
    }
}

function Get-WindowsFeatureState {
    param([string]$FeatureName)
    try {
        $feature = Get-WindowsOptionalFeature -Online -FeatureName $FeatureName -ErrorAction Stop
        return [PSCustomObject]@{ Available = $true; State = "$($feature.State)" }
    } catch {
        return [PSCustomObject]@{ Available = $false; State = 'No se pudo consultar sin permisos de administrador' }
    }
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
    $wslStatus = $null
    $wslVersionTwoReady = $false
    if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) {
        $wslStatus = Get-WslStatus
        if (-not $wslStatus.Available) {
            Write-ReadinessInfo 'WSL' 'no se encontro wsl.exe' 'Instala o habilita WSL si Docker Desktop usa el backend WSL 2.'
        } elseif ($wslStatus.ExitCode -ne 0) {
            Write-ReadinessInfo 'WSL' 'wsl --status no pudo consultar el estado' 'Ejecuta wsl --status para ver el detalle; Docker puede usar el backend Hyper-V.'
        } elseif ($wslStatus.Output -match '(?im)^\s*Default Version:\s*2\s*$') {
            $wslVersionTwoReady = $true
            Write-ReadinessResult $true 'WSL 2' 'WSL responde y la version predeterminada es 2' '' | Out-Null
        } else {
            Write-ReadinessInfo 'WSL 2' 'no se confirma WSL 2 como version predeterminada' 'Ejecuta wsl --status; Docker puede usar el backend Hyper-V.'
        }

        foreach ($featureName in @('Microsoft-Windows-Subsystem-Linux', 'VirtualMachinePlatform')) {
            $featureState = Get-WindowsFeatureState $featureName
            if (-not $featureState.Available) {
                Write-ReadinessInfo $featureName $featureState.State 'Consulta las caracteristicas de Windows desde PowerShell como administrador si Docker no inicia.'
            } else {
                $featureEnabled = $featureState.State -eq 'Enabled'
                Write-ReadinessInfo $featureName $featureState.State $(if ($featureEnabled) { '' } else { 'Habilitala para usar el backend WSL 2 de Docker Desktop.' })
                if ($featureEnabled -and $featureName -eq 'VirtualMachinePlatform') { $wslVersionTwoReady = $wslVersionTwoReady -and $featureEnabled }
                if (-not $featureEnabled) { $wslVersionTwoReady = $false }
            }
        }
    }

    $dockerExecutable = Get-DockerClientExecutable
    if (-not $dockerExecutable) {
        Write-ReadinessResult $false 'Docker' 'no se encontro un cliente Docker instalado' 'Elige [2] para instalar Docker Desktop.' | Out-Null
        $isReady = $false
    } else {
        $dockerVersionResult = Invoke-DockerCommand -Arguments @('--version')
        $dockerVersion = $dockerVersionResult.Output
        Write-ReadinessResult $true 'Docker' $dockerVersion '' | Out-Null

        $composeResult = Invoke-DockerCommand -Arguments @('compose', 'version')
        $composeReady = $composeResult.ExitCode -eq 0
        Write-ReadinessResult $composeReady 'Docker Compose' 'comando docker compose disponible' 'Actualiza Docker Desktop o instala el plugin de Compose.' | Out-Null
        if (-not $composeReady) { $isReady = $false }

        $daemonReady = Test-DockerDaemon
        if ($daemonReady) {
            Write-ReadinessResult $true 'Motor Docker' 'Docker Desktop o Docker Engine responde' '' | Out-Null
        } else {
            $dockerFix = 'Inicia Docker Desktop o el servicio Docker y espera a que termine de arrancar.'
            if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT -and -not $wslVersionTwoReady) {
                $dockerFix += ' Revisa el estado de WSL 2 y las caracteristicas Microsoft-Windows-Subsystem-Linux y VirtualMachinePlatform; puede requerirse reiniciar Windows.'
            }
            Write-ReadinessResult $false 'Motor Docker' 'no responde; Docker Desktop puede estar cerrado o su backend no estar listo' $dockerFix | Out-Null
        }
        if (-not $daemonReady) { $isReady = $false }

        if ($composeReady -and $daemonReady) {
            $composeConfigResult = Invoke-DockerCommand -Arguments @('compose', '-f', $composeFile, 'config', '--quiet')
            $composeConfigReady = $composeConfigResult.ExitCode -eq 0
            Write-ReadinessResult $composeConfigReady 'Configuracion Compose' 'infra/compose.yaml es valido' 'Revisa infra/compose.yaml.' | Out-Null
            if (-not $composeConfigReady) { $isReady = $false }

            $dbStatusResult = Invoke-DockerCommand -Arguments @('compose', '-f', $composeFile, 'ps', 'db', '--format', 'json')
            $dbStatus = $dbStatusResult.Output
            if ($dbStatusResult.ExitCode -ne 0 -or -not $dbStatus) {
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
    $choiceDescription = 'instalar herramientas faltantes y preparar completamente Modulo'
} elseif ($SkipPrerequisiteInstallation) {
    $preparationChoice = 'Prepare'
    $choiceDescription = 'preparar Modulo con las herramientas instaladas, sin cambiar la configuracion del usuario'
} else {
    $preparationChoice = Get-PreparationChoice
}

if ($preparationChoice -eq 'Check') {
    Refresh-ProcessToolPath
    if (-not (Test-ModuloReadiness)) { exit 1 }
    exit 0
}

if ($preparationChoice -eq 'Stop') {
    Write-Host 'Preparacion cancelada.'
    exit 0
}

# Hace disponibles en esta misma terminal instalaciones existentes de Docker/Volta.
Refresh-ProcessToolPath

if ($preparationChoice -eq 'Docker') {
    if (-not (Confirm-PreparationChoice 'iniciar Docker y PostgreSQL, sin preparar backend ni frontend')) {
        Write-Host 'No se realizo ninguna accion.'
        exit 0
    }

    Write-Host ''
    Write-Host '[Docker] Iniciando Docker y PostgreSQL...'
    if (-not (Test-DockerToolingAvailable)) {
        if (-not (Confirm-DockerDesktopInstallation)) {
            Write-Host 'Se necesita Docker con Compose para iniciar PostgreSQL con esta opcion. No se realizo ninguna accion.'
            exit 0
        }
        Install-DockerDesktop
    }
    Refresh-ProcessToolPath
    Require-Command 'docker' 'Instala Docker Desktop con Compose: https://docs.docker.com/get-docker/'
    $composeVersionResult = Invoke-DockerCommand -Arguments @('compose', 'version')
    Write-DockerCommandOutput $composeVersionResult
    if ($composeVersionResult.ExitCode -ne 0) { throw 'Docker Compose no esta disponible.' }
    if (-not (Start-DockerDaemon)) {
        throw 'Docker esta instalado, pero el motor no se pudo iniciar. Docker Desktop se abre automaticamente si esta instalado; completa su configuracion inicial y revisa WSL 2 antes de volver a ejecutar el script.'
    }

    Push-Location $repositoryRoot
    try {
        $postgresResult = Invoke-DockerCommand -Arguments @('compose', '-f', $composeFile, 'up', '-d', '--wait')
        Write-DockerCommandOutput $postgresResult
        if ($postgresResult.ExitCode -ne 0) { throw 'No se pudo iniciar PostgreSQL con Docker Compose.' }
    } finally {
        Pop-Location
    }
    Write-Host '[OK] Docker y PostgreSQL estan listos. No se modificaron backend, frontend ni migraciones.'
    Write-Host 'Si el backend ya estaba preparado y necesitas aplicarlas: cd backend; uv run --frozen --env-file .env python manage.py migrate'
    exit 0
}

$choiceDescription = if ($preparationChoice -eq 'Install') {
    'instalar herramientas faltantes y preparar completamente Modulo'
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

Write-Host ''
Write-Host '[1/3] Preparando backend...'
$envFile = Join-Path $backendPath '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendPath '.env.example') $envFile
    Write-Host '[OK] Creado backend/.env para desarrollo.'
} else {
    Write-Host '[OK] backend/.env ya existe; no se modifica.'
}

Push-Location $backendPath
try {
    $pythonVersion = (Get-Content (Join-Path $backendPath '.python-version') -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pythonVersion)) { throw 'backend/.python-version no contiene una version de Python.' }
    Write-Host "[... ] Asegurando Python $pythonVersion con uv..."
    uv python install $pythonVersion
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Python con uv.' }
    Write-Host '[... ] Sincronizando dependencias backend desde uv.lock...'
    uv sync --frozen --python $pythonVersion
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron sincronizar las dependencias Python.' }
    Write-Host '[OK] Entorno backend sincronizado con uv.lock.'
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '[2/3] Preparando frontend...'
Push-Location $frontendPath
try {
    # Volta ejecuta las versiones fijadas en frontend/package.json sin depender del orden de PATH.
    $package = Get-Content (Join-Path $frontendPath 'package.json') -Raw | ConvertFrom-Json
    $expectedNode = "v$($package.volta.node)"
    $expectedNpm = $package.volta.npm
    Write-Host "[... ] Asegurando Node $expectedNode y npm $expectedNpm con Volta..."
    volta fetch "node@$($package.volta.node)" "npm@$expectedNpm"
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo descargar las versiones declaradas de Node.js y npm.' }
    $nodeVersion = (volta run --node $package.volta.node --npm $expectedNpm -- node --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo ejecutar la version declarada de Node.js.' }
    $npmVersion = (volta run --node $package.volta.node --npm $expectedNpm -- npm --version).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Volta no pudo ejecutar la version declarada de npm.' }
    if ($nodeVersion -ne $expectedNode -or $npmVersion -ne $expectedNpm) {
        throw "Volta debe aplicar Node $expectedNode y npm $expectedNpm segun frontend/package.json."
    }
    Write-Host '[... ] Instalando dependencias frontend desde package-lock.json; la primera vez puede tardar mientras descarga y descomprime paquetes...'
    volta run --node $package.volta.node --npm $expectedNpm -- npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias Angular.' }
    Write-Host '[OK] Dependencias frontend instaladas desde package-lock.json.'
} finally {
    Pop-Location
}

if ($preparationChoice -eq 'Prepare' -and -not (Confirm-DockerStartup)) {
    Write-Host ''
    Write-Host '[OK] Backend y frontend estan preparados. Se omitieron Docker, PostgreSQL y las migraciones por eleccion.'
    Write-Host 'Cuando quieras iniciar solo Docker y PostgreSQL, vuelve a ejecutar el script y elige [4].'
    Write-Host 'Las migraciones quedan pendientes: cd backend; uv run --frozen --env-file .env python manage.py migrate'
    exit 0
}

Write-Host ''
Write-Host '[3/3] Preparando PostgreSQL y migraciones...'
Require-Command 'docker' 'Instala Docker con Compose: https://docs.docker.com/get-docker/'
$composeVersionResult = Invoke-DockerCommand -Arguments @('compose', 'version')
Write-DockerCommandOutput $composeVersionResult
if ($composeVersionResult.ExitCode -ne 0) { throw 'Docker Compose no esta disponible.' }

if (-not (Start-DockerDaemon)) {
    throw 'Docker esta instalado, pero el motor no se pudo iniciar. Docker Desktop se abre automaticamente si esta instalado; completa su configuracion inicial y revisa WSL 2 antes de volver a ejecutar el script.'
}

Push-Location $repositoryRoot
try {
    Write-Host '[... ] Iniciando PostgreSQL y esperando a que este saludable...'
    $postgresResult = Invoke-DockerCommand -Arguments @('compose', '-f', $composeFile, 'up', '-d', '--wait')
    Write-DockerCommandOutput $postgresResult
    if ($postgresResult.ExitCode -ne 0) { throw 'No se pudo iniciar PostgreSQL con Docker Compose.' }
    Write-Host '[OK] PostgreSQL esta listo.'
} finally {
    Pop-Location
}

Push-Location $backendPath
try {
    Write-Host '[... ] Aplicando migraciones Django...'
    uv run --frozen --env-file .env python manage.py migrate
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la aplicacion de migraciones.' }
    Write-Host '[... ] Ejecutando validacion Django...'
    uv run --frozen --env-file .env python manage.py check
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la validacion de Django.' }
    Write-Host '[OK] Migraciones y validacion Django completadas.'
} finally {
    Pop-Location
}

Write-Host 'Modulo preparado.'
Write-Host 'Backend:  cd backend; uv run --frozen --env-file .env python manage.py runserver'
Write-Host 'Frontend: cd frontend; npm start'
