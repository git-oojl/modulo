# Backend de Modulo

Este directorio contiene la API Django/DRF de Módulo. PostgreSQL es su
persistencia normal; el frontend Angular y cualquier cliente futuro consumen
su contrato bajo /api/v1. La especificación de producto está en
PROJECT_BIBLE.md; las decisiones y contratos técnicos se indexan en docs/.

## Primeros comandos

Desde backend, usa uv y el archivo local de entorno:

~~~powershell
uv sync --frozen
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py runserver
~~~

No uses Python global, pip ni una virtualenv preparada manualmente. La versión
Python se declara en .python-version y uv.lock fija dependencias. PostgreSQL
debe iniciarse desde la raíz del repositorio mediante Docker Compose antes de
migrar.

## Mapa del backend

~~~text
backend/
├── config/          settings, rutas raíz, health y configuración Django
├── accounts/        usuario, roles, sesión y directorio de asesores
├── organizations/   organización única y fuentes de captación
├── contacts/        CRM, actividades, intereses y seguimientos
├── properties/      inventario, catálogo público y medios
├── appointments/    agenda, resultados e ICS
├── closings/        cierres, comisión y transiciones transaccionales
├── integrations/    exportaciones y futuros adaptadores de borde
└── core/            permisos, bases compartidas, dashboard y comandos
~~~

Las aplicaciones son módulos de dominio del mismo monolito, no servicios
independientes. Las reglas que afectan más de un modelo viven en un servicio de
dominio con transacción; no se reparten entre serializers, signals y frontend.

## Configuración

backend/.env se copia desde .env.example y no pertenece a Git. Sus variables
locales de PostgreSQL deben coincidir con infra/compose.yaml. En desarrollo,
DJANGO_DEBUG habilita comportamiento local y Django sirve medios; esos valores
no son una configuración de despliegue.

Variables relevantes:

| Variable | Función |
| --- | --- |
| DJANGO_SECRET_KEY | Secreto de sesión/firmas; único por despliegue. |
| DJANGO_DEBUG | Activa sólo comportamiento de desarrollo. |
| DJANGO_ALLOWED_HOSTS | Hosts válidos para Django. |
| DJANGO_CSRF_TRUSTED_ORIGINS | Orígenes HTTPS de escritura cuando aplica. |
| POSTGRES_DB/USER/PASSWORD/HOST/PORT | Conexión a PostgreSQL. |

No añadas credenciales reales a .env.example, seeds, logs, fixtures o
documentación. Para analizar la conexión y operar la base consulta
docs/POSTGRESQL.md.

## Seguridad de API

La API privada usa sesión Django y CSRF; los recursos públicos se habilitan de
forma explícita. Los permisos se aplican con querysets por alcance y
comprobaciones de mutación. Ocultar controles de Angular no otorga acceso.

Los datos públicos se serializan de forma independiente: una propiedad de
catálogo no incluye dirección exacta, asesor, notas ni historial. Las
solicitudes públicas están limitadas por IP y requieren aceptar privacidad.
Consulta docs/API_BACKEND.md antes de modificar serializers o rutas.

## Desarrollo de dominio

Para añadir una regla persistente:

1. valida que está permitida por PROJECT_BIBLE.md;
2. cambia modelo y crea migración;
3. define validación local en serializer/modelo;
4. crea servicio atómico si coordina varios registros;
5. aplica alcance y permiso en view;
6. escribe pruebas de regla y de actor no autorizado;
7. actualiza modelo de datos/API/documentación si el contrato es estable.

No edites tablas a mano. No permitas que un PATCH genérico ejecute una
transición crítica que requiere historial, comisión, despublicación o bloqueo.

## Validación antes de entregar

~~~powershell
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test
~~~

Para una comprobación rápida de pruebas se puede definir DJANGO_DB_ENGINE con
SQLite, pero no reemplaza la suite contra PostgreSQL. Si Docker no está
disponible, informa ese bloqueo exacto en vez de asumir que la integración pasó.

Backend Django/DRF independiente de Modulo. En Windows, prepara el repositorio desde la raíz con [`scripts/setup.ps1`](../scripts/setup.ps1); consulta el [README principal](../README.md) para la preparación manual y los comandos locales.

La API vive en `/api/v1/`; su contrato y reglas de acceso están resumidos en [`docs/API_BACKEND.md`](../docs/API_BACKEND.md). Para preparar datos sintéticos locales, después de migrar ejecuta:

```powershell
uv run --frozen --env-file .env python manage.py seed_demo
```

En una base nueva, esto habilita el catálogo y genera un entorno sintético e idempotente, centrado en Tijuana, Mexicali y la costa de Baja California: seis cuentas, doce propiedades (borrador, activas, reservada, archivada y cerradas), doce contactos, intereses, actividades, seguimientos, citas, una venta vigente, una renta anulada y cubiertas SVG locales de demostración. No elimina ni modifica registros que no pertenezcan a este conjunto demo.

| Rol | Usuario |
| --- | --- |
| Administración | `admin.demo` |
| Gerencia | `gerencia.demo` |
| Asesores | `camila.ramos`, `diego.mendoza`, `sofia.soto`, `mateo.ruiz` |

La contraseña local de todas las cuentas es `DemoPassword123!`. No ejecutes este comando con datos reales.

Las pruebas pueden ejecutarse contra PostgreSQL de Docker. Para una comprobación rápida sin el servicio local, el equipo puede usar SQLite únicamente en modo de prueba:

```powershell
$env:DJANGO_DB_ENGINE = 'django.db.backends.sqlite3'
uv run --frozen --env-file .env python manage.py test
```

La aplicación normal siempre usa PostgreSQL salvo que se configure explícitamente ese entorno de prueba.
