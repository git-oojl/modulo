# Datos demo

`seed_demo` crea un entorno sintético para desarrollo local. No contiene clientes reales y no sustituye una política de respaldo.

En Windows, el camino más corto desde el preparador es elegir `[6] Migrar y
cargar datos demo sintéticos`; inicia PostgreSQL si hace falta, aplica las
migraciones y ejecuta la semilla. La opción no instala ni actualiza
dependencias.

```powershell
cd backend
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py seed_demo
```

La semilla es idempotente: al ejecutarla otra vez actualiza el conjunto demo conocido. No la ejecutes sobre una base real.

Incluye organización demo de Baja California, administración, gerencia y cuatro asesores; doce propiedades sintéticas (seis en Tijuana, cinco en Mexicali y una en Playas de Rosarito); contactos en todos los estados; actividades, intereses, seguimientos; citas en todos sus resultados; y una venta vigente junto con una renta anulada.

Todas las cuentas usan `DemoPassword123!`. Consulta [backend/README.md](../backend/README.md) para usuarios. Las cubiertas se generan en `backend/media/` y son SVG sintéticos, no fotografías comerciales.
