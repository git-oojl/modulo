# Desarrollo diario

## Preparación

En Windows, la ruta principal es:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

El script prepara `.env` si falta, sincroniza uv y npm, levanta PostgreSQL y aplica migraciones. Consulta [INSTALACION_HERRAMIENTAS.md](INSTALACION_HERRAMIENTAS.md) si falta una herramienta.

Para una base local recién creada, la opción `[6]` del mismo menú aplica
migraciones y ejecuta `seed_demo`. Solo úsala con datos sintéticos; el comando
es idempotente, pero no está pensado para una base real.

## Servidores locales

En dos terminales:

```powershell
cd backend
uv run --frozen --env-file .env python manage.py runserver
```

```powershell
cd frontend
npm run dev
```

Angular usa el proxy local para `/api/v1/`; no escribas URLs absolutas del backend en componentes.

## Antes de entregar

```powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test
```

```powershell
cd frontend
npm run format:check
npm run lint
npm run build
```

Revisa `git status`; incluye migraciones con modelos, ambos lockfiles con dependencias y usa commits concisos en español.
