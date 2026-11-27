# Guía del backend

El backend usa Python 3.12, Django 5.2 LTS, Django REST Framework, PostgreSQL 17 y `uv`. Ejecuta comandos desde `backend/` con `uv run`; no uses `python`, `pip` ni cambios manuales de `.venv`.

## Módulos

| App | Responsabilidad |
| --- | --- |
| `accounts` | Usuario Django, roles, perfil de asesor y sesión. |
| `organizations` | Organización única, branding y fuentes. |
| `contacts` | Contactos, intereses, actividades y seguimientos. |
| `properties` | Inventario, ubicación, visibilidad y referencias a medios. |
| `appointments` | Citas, resultados, seguimiento e ICS. |
| `closings` | Cierres, comisión estimada y coherencia del inventario. |
| `integrations` | Exportaciones y adaptadores sin acoplar proveedores al dominio. |
| `core` | Bases compartidas, permisos, dashboard y comandos de gestión. |

## Patrón para una función nueva

1. Define o ajusta el modelo en su app de dominio.
2. Crea una migración Django; nunca edites la base directamente.
3. Pon una regla multi-registro o de ciclo de vida en `services.py` y usa `transaction.atomic` cuando corresponda.
4. Expón el contrato con serializer, view y URL versionada.
5. Aplica visibilidad en `get_queryset()` y autorización en el backend.
6. Añade pruebas que protejan la regla, no solo una respuesta feliz.
7. Actualiza [API_BACKEND.md](API_BACKEND.md) si cambia un contrato estable.

## Reglas que no deben dispersarse

- Cerrar una propiedad ocurre al registrar un cierre, no desde un PATCH normal.
- Completar una cita conserva resultado y crea actividad/seguimiento mediante su servicio.
- Un asesor recibe sus contactos, citas, seguimientos y cierres; inventario ajeno solo si está activo.
- La publicación exige `status=activa`, `is_public=true` y catálogo habilitado.
- Los archivos viven fuera de PostgreSQL; la base guarda metadatos y referencia.

## Migraciones y validación

```powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test
```

La base API es `/api/v1/`. Para un POST autenticado, el navegador obtiene `/api/v1/auth/csrf/` y usa la cookie `csrftoken` con `X-CSRFToken`. No guardes tokens o contraseñas en `localStorage`.
