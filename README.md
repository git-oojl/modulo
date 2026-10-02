# Modulo

Modulo es una plataforma modular, API-first, para la operación inmobiliaria: centraliza contactos, propiedades, citas y seguimiento en un sistema que la empresa controla.

## Requisitos

- Git
- [Volta](https://volta.sh/) (Node.js `22.23.3` y npm `10.9.9` se fijan en `frontend/package.json`)
- [uv](https://docs.astral.sh/uv/) para Python `3.12.14`
- PostgreSQL 17.x instalado y disponible localmente

## Clonar y preparar

```powershell
git clone <URL_DEL_REPOSITORIO> Modulo
cd Modulo
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

El script verifica los prerrequisitos instalados en el sistema.

## Preparación manual equivalente

```powershell
cd frontend
npm ci

cd ..\backend
uv python install 3.12.14
uv sync --frozen
Copy-Item .env.example .env
```

Configura en `backend/.env` las credenciales locales de PostgreSQL 17 antes de ejecutar migraciones.

## Desarrollo local

Frontend Angular:

```powershell
cd frontend
npm start
```

Comprobación básica de Django:

```powershell
cd backend
uv run python manage.py check
```

Cuando PostgreSQL esté configurado, aplica las migraciones y ejecuta el backend:

```powershell
uv run python manage.py migrate
uv run python manage.py runserver
```

## Diferido intencionalmente

Docker/Docker Compose, Valkey, Celery en ejecución, Android Studio, Android SDK y sus emuladores serán integrados aparte . Capacitor y el soporte PWA quedan preparados, sin proyecto Android ni configuración de esas herramientas pesadas.
