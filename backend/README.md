# Backend de Modulo

Backend Django/DRF independiente de Modulo. En Windows, prepara el repositorio desde la raíz con [`scripts/setup.ps1`](../scripts/setup.ps1); consulta el [README principal](../README.md) para la preparación manual y los comandos locales.

La API vive en `/api/v1/`; su contrato y reglas de acceso están resumidos en [`docs/API_BACKEND.md`](../docs/API_BACKEND.md). Para preparar datos sintéticos locales, después de migrar ejecuta:

```powershell
uv run --frozen --env-file .env python manage.py seed_demo
```

Esto habilita el catálogo de demostración y crea `gerencia.demo` y `asesor.demo`, ambos con la contraseña local `DemoPassword123!`. No ejecutes este comando con datos reales.

Las pruebas pueden ejecutarse contra PostgreSQL de Docker. Para una comprobación rápida sin el servicio local, el equipo puede usar SQLite únicamente en modo de prueba:

```powershell
$env:DJANGO_DB_ENGINE = 'django.db.backends.sqlite3'
uv run --frozen --env-file .env python manage.py test
```

La aplicación normal siempre usa PostgreSQL salvo que se configure explícitamente ese entorno de prueba.
