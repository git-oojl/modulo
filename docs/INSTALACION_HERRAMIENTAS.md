# Instalación de herramientas

Esta guía prepara las tres herramientas que usa Modulo: [uv](https://docs.astral.sh/uv/) para Python, [Volta](https://docs.volta.sh/) para Node.js y npm, y [Docker Compose](https://docs.docker.com/compose/) para PostgreSQL. Instálalas una vez por equipo, abre una terminal nueva y vuelve a este repositorio.

No instales Python, Node.js, npm ni PostgreSQL manualmente solo para Modulo. Si ya los tienes para otros proyectos, pueden coexistir: esta guía prioriza los gestores del proyecto y no pide desinstalar nada salvo que haya un conflicto real de `PATH` o de puertos.

## Comprobar antes de instalar

Ejecuta lo siguiente en una terminal nueva:

```bash
uv --version
volta --version
docker --version
docker compose version
docker info
```

Los cuatro primeros comandos confirman que los clientes están disponibles. `docker info` también confirma que el motor está iniciado. En Windows y macOS, abre Docker Desktop si el comando indica que no puede conectar al daemon.

Para revisar actualizaciones, consulta primero la documentación de cada herramienta: [actualizar uv](https://docs.astral.sh/uv/getting-started/installation/#upgrading-uv), [actualizar Volta](https://docs.volta.sh/guide/getting-started) y [actualizar Docker Desktop](https://docs.docker.com/desktop/setup/install/upgrade/). Mantén las herramientas actualizadas con un método coherente con el que usaste para instalarlas (por ejemplo, WinGet, Homebrew o el instalador oficial). No hace falta actualizar una versión de runtime global para este repositorio: uv y Volta leerán sus declaraciones locales.

## uv y Python

uv instala y selecciona el Python que necesita cada proyecto. En Modulo, `backend/.python-version` indica el intérprete; `backend/pyproject.toml` define el rango compatible; y `backend/uv.lock` fija las dependencias. Desde `backend/`, `uv python install` instala la versión declarada si no existe y `uv sync --frozen` crea o actualiza `.venv` respetando el lockfile.

Comprueba qué se usará sin depender de tu Python global:

```bash
cd backend
uv python find
uv run --frozen python --version
uv tree --frozen
```

### Instalar uv

Sigue siempre las [instrucciones oficiales de uv](https://docs.astral.sh/uv/getting-started/installation/). Opciones habituales:

- Windows: `winget install --id astral-sh.uv -e` o el instalador oficial de uv.
- macOS: `brew install uv` si ya usas Homebrew, o el instalador oficial.
- Linux: el instalador oficial o el gestor de paquetes indicado por la documentación de uv.

Cierra y abre la terminal después de instalar. En Windows, `Get-Command uv` muestra el ejecutable que se resolverá; en macOS/Linux usa `command -v uv`.

### Python ya instalado o gestionado por otra herramienta

Puedes conservar Python del sistema, pyenv, conda, asdf o cualquier otro gestor. uv no los elimina y puede encontrarlos, pero Modulo se prepara de forma más reproducible dejando que uv instale la versión indicada por `.python-version`. Evita crear un entorno virtual manual o ejecutar `pip install` dentro de `backend/`: usa `uv sync --frozen` y `uv run`.

Si una política de tu equipo exige un Python concreto, comprueba `uv python find` y consulta [la resolución de intérpretes de uv](https://docs.astral.sh/uv/concepts/python-versions/). Si el resultado no corresponde a la declaración del repositorio, no edites el lockfile para corregirlo: instala el intérprete con `uv python install` y vuelve a sincronizar.

## Volta, Node.js y npm

Volta es el gestor de Node.js y npm para Modulo. `frontend/package.json` contiene los pines de Volta y npm; `frontend/package-lock.json` fija el árbol de dependencias. Ejecuta los comandos npm desde `frontend/`, donde Volta detecta esos pines.

```bash
cd frontend
volta list
node --version
npm --version
npm ci
```

`npm ci` usa el lockfile tal como está versionado; no sustituyas este comando por `npm install` durante la preparación inicial.

### Instalar Volta

Usa la [guía oficial de instalación de Volta](https://docs.volta.sh/guide/getting-started). En Windows también puedes usar:

```powershell
winget install --id Volta.Volta -e
```

En macOS y Linux, usa el instalador mostrado por la documentación oficial. Abre una terminal nueva y confirma `volta --version` antes de continuar. Al entrar en `frontend/`, la primera ejecución de `node` o `npm` puede descargar los runtimes declarados por el proyecto.

### Node.js, npm, nvm o fnm ya instalados

No desinstales Node.js, nvm, fnm, asdf o una instalación corporativa solo por usar Modulo. El requisito es que los shims de Volta tengan prioridad al trabajar en este repositorio. Comprueba `volta which node` y `volta which npm`; después confirma que `node --version` y `npm --version`, ejecutados desde `frontend/`, coinciden con el bloque `volta` y `packageManager` de `frontend/package.json`.

Si no coinciden, revisa el orden de `PATH` y la inicialización de nvm/fnm en tu shell. No mezcles gestores en la misma sesión: abre una terminal limpia, activa Volta según su instalación y vuelve a ejecutar las comprobaciones. Los paquetes globales de npm tampoco forman parte de la preparación de Modulo; las herramientas del proyecto se instalan con `npm ci`.

## Docker y Docker Compose

La configuración de desarrollo está en `infra/compose.yaml`. Compose inicia únicamente PostgreSQL en un volumen Docker llamado por el proyecto y lo publica por defecto en `127.0.0.1:5432`. Django y Angular se ejecutan en el host.

### Instalar Docker

- Windows: instala [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/). Requiere la virtualización compatible indicada por Docker; completa la configuración inicial de Docker Desktop.
- macOS: instala [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/).
- Linux: instala [Docker Engine](https://docs.docker.com/engine/install/) para tu distribución y el [plugin de Docker Compose](https://docs.docker.com/compose/install/linux/). Docker Desktop para Linux es una alternativa si tu equipo lo prefiere.

Las versiones actuales de Docker Desktop y el plugin incluyen Compose como `docker compose`. No instales el binario heredado `docker-compose` si `docker compose version` ya funciona. Si ya tienes Docker Engine o Docker Desktop, consérvalo y verifica que el daemon esté encendido con `docker info`.

En Windows, el preparador opcional de este repositorio puede solicitar la instalación de los clientes faltantes mediante WinGet; Docker Desktop aún puede requerir que aceptes su configuración inicial y lo inicies:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -InstallPrerequisites
```

Además, el parámetro configura el usuario actual para que los shims de Volta queden primero en `PATH` y establece `UV_MANAGED_PYTHON=true`. Así, las terminales nuevas prefieren Volta para Node.js/npm y uv descarga el Python declarado por el proyecto. En la preparación, el script ejecuta `volta fetch` con las versiones de `frontend/package.json`: las descarga en la caché de Volta sin cambiar el runtime predeterminado para otros proyectos. No desinstala Node.js, Python, nvm/fnm ni otros gestores: permanecen disponibles si se invocan con su ruta o se cambia el `PATH`. Después de que WinGet instale algo, abre otra terminal y ejecútalo de nuevo sin parámetros.

### PostgreSQL existente y conflictos de puerto

No hace falta instalar PostgreSQL en el host. Una instalación o contenedor existente puede seguir funcionando; el único conflicto habitual es el puerto publicado. Antes de levantar Modulo, inspecciona el estado:

```bash
docker compose -f infra/compose.yaml ps
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

En Windows también puedes identificar quién usa el puerto con:

```powershell
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
```

Si `5432` ya está ocupado, elige un puerto libre, por ejemplo `5433`, y cambia **ambos** valores locales: el lado izquierdo de `ports` en `infra/compose.yaml` a `127.0.0.1:5433:5432` y `POSTGRES_PORT=5433` en `backend/.env`. No detengas ni borres el contenedor o la base de otro proyecto para liberar el puerto.

Para iniciar la base de datos de Modulo:

```bash
docker compose -f infra/compose.yaml up -d --wait
docker compose -f infra/compose.yaml ps
```

El volumen persiste al ejecutar `docker compose ... down`. No uses `down -v` salvo que quieras eliminar deliberadamente la base de datos local de Modulo.

## Preparar Modulo después de las herramientas

Vuelve al [README principal](../README.md) y sigue «Clonar y preparar». El script `scripts/setup.ps1` automatiza esa secuencia en Windows: crea `backend/.env` solo si falta, sincroniza dependencias bloqueadas, inicia PostgreSQL y aplica migraciones. No sobrescribe un `.env` existente ni modifica las declaraciones de versiones o los lockfiles.
