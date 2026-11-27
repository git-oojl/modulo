# Guía del backend

## Estructura de una app Django

~~~text
<app>/
├── models.py          entidades, relaciones, constraints e índices
├── migrations/        historia reproducible del esquema
├── serializers.py     contratos de entrada/salida y validación local
├── views.py           transporte HTTP, filtros y permisos
├── services.py        transiciones coordinadas cuando aplica
├── urls.py            rutas de la app
├── admin.py           soporte administrativo de desarrollo
└── tests.py           casos de contrato, permiso e invariantes
~~~

No todas las apps necesitan services.py; añádelo cuando la acción cambia dos o
más registros, requiere bloqueo, debe conservar historia o necesita ser
reutilizable fuera de una vista. Evita signals ocultas para reglas importantes:
hacen difícil ver orden, transacciones, errores y pruebas.

## Autorización en detalle

La vista primero limita get_queryset usando scoped_*_queryset. Eso protege
listado y búsqueda por UUID. Para acciones de escritura, la vista verifica
además que un asesor sea responsable del recurso cuando aplica. Los permisos
reutilizables de rol están en core/permissions.py:

- IsManager: gerencia, administración o superusuario.
- IsAdmin: administración o superusuario.
- is_manager e is_admin: predicados para decisiones locales.
- scoped_contact_queryset, scoped_property_queryset,
  scoped_appointment_queryset y scoped_closing_queryset: alcance por rol.

Al agregar un recurso, decide primero quién puede listarlo, consultarlo,
crearlo, editarlo, ejecutar acciones especiales y exportarlo. Implementa cada
caso en backend y prueba al menos un actor permitido y uno denegado. No uses
un UUID como prueba de autorización.

## Validación: qué va en cada sitio

| Lugar | Responsabilidad |
| --- | --- |
| Serializer | Tipo, formato, required/optional y consistencia de payload local. |
| Model.clean() | Invariante de la entidad útil también fuera de DRF. |
| Servicio | Regla que coordina entidades y transición de estado. |
| Constraint de base | Invariante que debe sobrevivir errores de código o concurrencia. |
| View | Actor, recurso visible y código HTTP. |

Ejemplo: que una propiedad pública esté activa se valida en serializer y como
CheckConstraint; que un cierre retire una propiedad del catálogo pertenece a un
servicio transaccional. No dupliques el código de transición en todos esos
sitios: cada capa cubre una dimensión distinta.

## Transacciones y concurrencia

Usa transaction.atomic() para una operación que no debe observarse a medias.
Cuando dos requests podrían modificar el mismo inventario o cierre, relee el
registro con select_for_update() dentro de la transacción. El patrón actual en
cierres es la referencia:

~~~python
@transaction.atomic
def operation(*, record_id, actor):
    record = Record.objects.select_for_update().get(pk=record_id)
    # validar estado actual, actualizar relaciones, guardar todo
    return record
~~~

No mantengas una transacción abierta mientras llamas un proveedor de red,
esperas input humano o generas un archivo grande. Cuando se necesite trabajo
asíncrono, define un contrato de tarea e idempotencia primero.

## Serializers y cambios de contrato

Expón campos explícitamente en Meta.fields; no uses __all__ para recursos de
negocio. Separa serializadores públicos de internos incluso si inicialmente
coinciden. Los campos de asignación suelen ser de solo escritura (advisor_id) y
los objetos de referencia son de solo lectura (advisor): esto evita que el
cliente tenga que construir representaciones internas.

Al evolucionar un serializer:

1. revisa consumidores y OpenAPI;
2. prefiere añadir campos opcionales antes de renombrar/eliminar;
3. valida compatibilidad de los datos de migración;
4. documenta cambio de contrato en API_BACKEND.md;
5. añade una prueba que fije la forma que importa.

## Medios y carga de archivos

Las cargas usan multipart/form-data, no JSON con base64. La validación actual
limita archivos a 10 MB y a JPEG, PNG, WEBP o PDF. Es un límite de aplicación,
no una solución completa de seguridad de archivos. No modifiques MEDIA_ROOT,
storage o exposición de URLs sin considerar permisos, antivirus, backups, costo
y producción.

## Pruebas recomendadas

Las pruebas deben proteger reglas y límites, no sólo cubrir un 200:

- serializer: validación de payload, estados incompatibles y campos ocultos;
- permisos: asesor propio/ajeno, gerencia y administración;
- servicios: transacción y efecto en todos los modelos afectados;
- API: respuesta, paginación, filtros y códigos 400/403/404;
- regresión: bug que ya ocurrió o comportamiento que no debe reaparecer;
- seed: idempotencia y datos esenciales si cambia el comando.

Ejecuta pruebas normalmente con PostgreSQL. Para una prueba rápida aislada se
puede configurar SQLite mediante DJANGO_DB_ENGINE, pero una suite verde ahí no
reemplaza la validación contra PostgreSQL.

## Administración, shell y consultas seguras

Para inspección Django, usa el shell del entorno administrado:

~~~powershell
cd backend
uv run --frozen --env-file .env python manage.py shell
~~~

Es útil para lectura acotada durante desarrollo, pero no para aplicar cambios
de esquema ni corregir datos de producción sin un procedimiento revisado. Para
consultas SQL locales consulta POSTGRESQL.md; para la forma de datos
públicos/privados consulta API_BACKEND.md.

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
