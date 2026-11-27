# Contrato de la API backend

La API de Módulo está bajo `/api/v1/`, usa JSON UTF-8 y está versionada como
un contrato de servidor. Este documento explica los recursos, permisos y
convenciones durables. El esquema exacto, incluidos tipos y respuestas, se
genera en tiempo de ejecución en `/api/v1/schema/` y se consulta de forma
interactiva en `/api/v1/docs/`.

No se deben inferir reglas de una pantalla. Si un cliente necesita un campo o
una transición que aquí no existe, debe proponerse y añadirse en backend con
validación, permiso, prueba, OpenAPI y documentación proporcional.

## Convenciones comunes

| Tema | Contrato |
| --- | --- |
| Base | `/api/v1/`; las rutas de router terminan en `/`. |
| Formato | Request/response JSON, salvo CSV, ICS y carga multipart de medios. |
| Fechas | ISO 8601 con zona horaria para datetimes; `YYYY-MM-DD` para fechas de cierre. |
| Identificadores | UUID para recursos operativos y `public_id` UUID para usuarios expuestos. |
| Colecciones | Paginación de DRF: hasta 25 elementos; respuesta con `count`, `next`, `previous`, `results`. |
| Errores | `400` para validación, `401` sin sesión, `403` sin permiso, `404` no visible/no existente. |
| Escritura | Sesión válida y CSRF; `POST`, `PUT`, `PATCH`, `DELETE` no aceptan una cookie sola. |
| Eliminación | En recursos de negocio suele ser archivado/cancelación/anulación, no borrado físico. |

Los filtros de fecha, UUID y valores de enumeración se validan en el servidor.
Un cliente debe enviar solo nombres de campos del contrato, no campos
calculados, IDs inventados o banderas de autorización.

## Sesión y CSRF

La API privada usa `SessionAuthentication` de Django. Flujo para un cliente
web del mismo origen o a través del proxy de desarrollo:

1. `GET /api/v1/auth/csrf/` establece/renueva `csrftoken` y devuelve el token.
2. `POST /api/v1/auth/login/` con `username` y `password`, más encabezado
   `X-CSRFToken`, abre sesión y devuelve el usuario actual.
3. El navegador conserva la cookie de sesión HttpOnly; el cliente no guarda la
   contraseña ni un token de acceso en almacenamiento local.
4. Toda escritura posterior envía el token CSRF y las cookies con las
   credenciales del navegador.
5. `POST /api/v1/auth/logout/` invalida la sesión y responde `204`.

Ejemplo de login:

```http
POST /api/v1/auth/login/
Content-Type: application/json
X-CSRFToken: <cookie csrftoken>

{"username":"camila.ramos","password":"..."}
```

El campo `username` también acepta correo si coincide sin distinguir
mayúsculas/minúsculas. Credenciales erróneas responden una validación genérica;
no revelan si una cuenta existe.

| Ruta | Método | Sesión | Resultado |
| --- | --- | --- | --- |
| `/auth/csrf/` | GET | No | Cookie CSRF y `{ "csrfToken": "..." }`. |
| `/auth/login/` | POST | No | Inicia sesión y devuelve usuario actual. |
| `/auth/logout/` | POST | Sí | Cierra sesión, `204`. |
| `/auth/me/` | GET | Sí | Usuario actual: UUID público, nombre, rol, usuario y correo. |

No hay registro público, recuperación de contraseña ni tokens Bearer en este
contrato todavía. No los simules desde la interfaz como si existieran.

## Roles y alcance

| Rol | Alcance efectivo |
| --- | --- |
| Asesor | Contactos, citas, seguimientos y cierres propios; propiedades propias y propiedades activas visibles para consulta. |
| Gerencia | Operación completa, catálogo de fuentes, directorio de asesores y cambios de negocio autorizados. |
| Administración | Alcance de gerencia más usuarios y configuración de organización. |

`is_superuser` conserva privilegio administrativo. La autorización se aplica
tanto al listado como a detalle/acciones. Si un UUID no pertenece al alcance
del usuario, el cliente no debe intentar resolverlo con datos cacheados ni
asumir que puede editarlo.

## Infraestructura y descubrimiento

| Ruta | Método | Acceso | Uso |
| --- | --- | --- | --- |
| `/health/` | GET | Público | Confirma API y conexión a base. Devuelve `ok` o `503 degraded`. |
| `/schema/` | GET | Público | OpenAPI generado. |
| `/docs/` | GET | Público | Swagger UI para desarrollo e integración. |
| `/admin/` | GET | Personal Django | Administración de desarrollo; no es contrato de clientes. |

El health check no expone credenciales, versión de PostgreSQL ni estado de
dominios. Monitoreo productivo debe autenticarse o limitarse en la capa de
infraestructura si revelar disponibilidad pública deja de ser apropiado.

## Usuarios, asesores y organización

### Usuarios

`/users/` es exclusivo de administración.

| Ruta | Métodos | Campos de escritura principales |
| --- | --- | --- |
| `/users/` | GET, POST | `username`, nombre, apellido, `email`, `role`, `is_active`, contraseña opcional. |
| `/users/{public_id}/` | GET, PUT, PATCH, DELETE | Mismos campos, sin exponer hash. |
| `/agents/` | GET, detalle GET | Directorio de asesores; gerencia/administración. |

La contraseña, cuando se proporciona, debe tener al menos 12 caracteres y se
procesa con `set_password`. Crear un asesor crea su `AdvisorProfile`; los
datos de perfil se consultan en el campo `profile` del serializer administrativo.

### Organización y fuentes

| Ruta | Métodos | Acceso | Nota |
| --- | --- | --- | --- |
| `/organization/` | GET | Cualquier sesión | Puede devolver `204` si aún no existe. |
| `/organization/` | PATCH | Administración | Marca, configuración local y catálogo público. |
| `/sources/` | GET, detalle GET | Cualquier sesión | Fuentes de captura. |
| `/sources/` | POST, PUT, PATCH, DELETE | Gerencia/administración | Gestiona catálogo, no borra historial de contactos. |

El interruptor `public_catalogue_enabled` controla la visibilidad pública en
todo el backend. Un cliente no puede compensarlo mostrando registros locales
cacheados como si siguieran publicados.

## Contactos y seguimiento

Base: `/contacts/`. Todos los contactos internos incluyen UUID, datos básicos,
asesor, fuente, estado, notas y relaciones históricas de solo lectura.

| Ruta | Métodos | Acción |
| --- | --- | --- |
| `/contacts/` | GET, POST | Lista o crea contacto. Asesor queda asignado al actor; gerencia puede enviar `advisor_id`. |
| `/contacts/{id}/` | GET, PUT, PATCH, DELETE | Consulta/edita; DELETE lo marca `inactivo`. |
| `/contacts/{id}/activities/` | GET, POST | Lista o agrega actividad de historial. |
| `/contacts/{id}/interests/` | GET, POST | Lista o relaciona una propiedad con el contacto. |
| `/contacts/{id}/follow-ups/` | GET, POST | Lista o crea seguimiento pendiente. |
| `/contacts/{id}/follow-ups/{follow_up_id}/complete/` | POST | Completa un seguimiento autorizado. |

Filtros del listado: `q` busca nombre, teléfono o correo; `status`, `source` y
`advisor` restringen por valor/UUID público. La capacidad de usar `advisor` no
amplía el alcance de un asesor.

Ejemplo mínimo de alta:

```json
{
  "name": "Elena Martínez",
  "phone": "+52 664 000 0000",
  "email": "elena@example.test",
  "source": "<uuid-de-fuente>",
  "status": "prospecto",
  "notes": "Busca vivienda cerca de su trabajo."
}
```

Actividad acepta `type`, `content` y `occurred_at`; el creador se obtiene de
la sesión. Un interés recibe `property_id` y una nota. Un seguimiento recibe
`due_at`, nota y opcionalmente `assigned_to_id` para gerencia. El backend
protege asignaciones y no permite convertir una relación invisible en una
relación propia.

## Propiedades y medios

Base: `/properties/`. Una propiedad interna expone inventario completo; nunca
se reutiliza esa respuesta para el catálogo público.

| Ruta | Métodos | Acción |
| --- | --- | --- |
| `/properties/` | GET, POST | Lista o crea propiedad. Gerencia debe asignar `advisor_id`; un asesor queda como responsable. |
| `/properties/{id}/` | GET, PUT, PATCH, DELETE | Consulta/edita; DELETE archiva y despublica. |
| `/properties/{id}/media/` | GET, POST | Lista metadatos o carga medio multipart. |
| `/properties/{id}/media/{media_id}/` | PATCH, DELETE | Corrige metadatos o elimina la referencia/archivo. |

Filtros: `q` (título, ciudad, colonia), `status`, `operation`, `type`,
`advisor` y `is_public=true|false`.

Campos de escritura principales:

```json
{
  "title": "Casa en Cumbres de Juárez",
  "type": "casa",
  "operation": "venta",
  "status": "activa",
  "price": "485000.00",
  "currency": "USD",
  "city": "Tijuana",
  "public_location": "Cumbres de Juárez, Tijuana",
  "bedrooms": 3,
  "bathrooms": 2,
  "area_m2": "185.00",
  "features": ["patio", "cochera"],
  "is_public": false
}
```

`is_public=true` requiere `status=activa`. No se acepta pasar a `cerrada` por
PATCH; se registra un cierre. Los medios admiten JPEG, PNG, WEBP o PDF de hasta
10 MB, más `alt_text`, `sort_order` e `is_cover`.

## Citas

Base: `/appointments/`. Una cita pertenece a un contacto y a un asesor; puede
referir una propiedad y una fuente.

| Ruta | Métodos | Acción |
| --- | --- | --- |
| `/appointments/` | GET, POST | Lista o crea cita. |
| `/appointments/{id}/` | GET, PUT, PATCH, DELETE | Consulta/edita; DELETE la cancela. |
| `/appointments/{id}/complete/` | POST | Registra resultado y opcionalmente siguiente seguimiento, de forma atómica. |
| `/appointments/{id}/ics/` | GET | Descarga evento `text/calendar`. |

Filtros: `from`, `to` por fecha de inicio; `advisor`, `status`, `purpose` y
`source`. Los propósitos son `visita`, `captacion`, `cierre`, `otro`; estados
admitidos incluyen `programada`, `confirmada`, `completada`, `cancelada` y
`no_asistio`.

Para completar, no envíes un PATCH de estado. Usa:

```json
{
  "result": "La persona solicitó una segunda visita.",
  "next_follow_up_at": "2026-12-02T17:00:00Z",
  "follow_up_note": "Confirmar disponibilidad del inmueble."
}
```

Esto conserva resultado, crea actividad CRM y, si se solicita, seguimiento
pendiente. `ends_at` debe ser posterior a `starts_at` cuando se envía.

## Cierres y comisión

Base: `/closings/`. Los cierres son registros económicos y su borrado físico
no está permitido.

| Ruta | Métodos | Acceso | Acción |
| --- | --- | --- | --- |
| `/closings/` | GET | Según alcance | Lista cierres visibles. |
| `/closings/` | POST | Gerencia/administración | Registra cierre y despublica/cierra propiedad en una transacción. |
| `/closings/{id}/` | GET | Según alcance | Detalle. |
| `/closings/{id}/` | PUT, PATCH | Gerencia/administración | Corrige cierre vigente. |
| `/closings/{id}/` | DELETE | Gerencia/administración | Siempre `405`; se debe anular. |
| `/closings/{id}/void/` | POST | Gerencia/administración | Marca cierre anulado y conserva trazabilidad. |
| `/closings/{id}/commission/` | PATCH | Gerencia/administración | Cambia porcentaje/estado de comisión. |

Filtros: `status`, `operation`, `advisor`, `commission_status`, `from` y `to`.
Un alta debe mantener la misma operación que la propiedad. No puede haber dos
cierres vigentes para una misma propiedad. Anular no republica ni reactiva el
inventario sin una decisión posterior explícita.

Ejemplo:

```json
{
  "property": "<uuid-propiedad>",
  "contact": "<uuid-contacto>",
  "operation": "venta",
  "closed_on": "2026-11-21",
  "amount": "485000.00",
  "currency": "USD",
  "commission": {"percentage": "4.00", "status": "pendiente"}
}
```

`amount` de comisión es calculado por el servidor cuando existe porcentaje.
No se debe usar este registro como contabilidad fiscal o liquidación formal sin
extender el dominio y sus controles.

## Dashboard y exportaciones

| Ruta | Método | Uso |
| --- | --- | --- |
| `/dashboard/` | GET | Resumen operativo por rol: citas próximas, seguimientos pendientes, inventario por estado, actividad reciente y cierres. |
| `/integrations/exports/contacts/` | GET | CSV de contactos dentro del alcance. |
| `/integrations/exports/properties/` | GET | CSV de inventario dentro del alcance. |
| `/integrations/exports/appointments/` | GET | CSV de citas dentro del alcance. |

Dashboard acepta `days` entre 1 y 90; gerencia/administración puede filtrar por
`advisor`, y se admiten `property_status`, `from`, `to` donde aplican. Es una
instantánea operativa, no un sistema de BI ni sustituto de reportes contables.

Las exportaciones devuelven `text/csv` UTF-8 con BOM y respetan el mismo
alcance de datos. Una descarga no concede permiso de redistribución ni debe
incluirse en repositorios o tickets públicos.

## Catálogo y consulta pública

| Ruta | Método | Acceso | Contrato |
| --- | --- | --- | --- |
| `/public/properties/` | GET | Público | Colección de inmuebles activos y publicados. |
| `/public/properties/{id}/` | GET | Público | Detalle público. |
| `/public/inquiries/` | POST | Público | Crea contacto no asignado e interés en una propiedad disponible. |

El listado público filtra por `operation`, `type`, `city` y `q`. Solo opera si
la organización habilitó el catálogo y no revela dirección exacta, asesor,
notas, historial ni metadatos de operación interna.

Consulta pública mínima:

```json
{
  "property": "<uuid-publico>",
  "name": "Nombre de contacto",
  "phone": "+52 664 000 0000",
  "email": "persona@example.test",
  "message": "Deseo más información.",
  "privacy_accepted": true
}
```

`privacy_accepted` debe ser verdadero y la propiedad debe seguir activa y
publicada al momento de validar. Se aplica límite anónimo de 10 solicitudes
por hora por IP. No uses esta ruta para registrar cuentas, modificar un
contacto existente ni enviar información de una propiedad no pública.

## Compatibilidad y evolución

Una modificación compatible puede añadir un campo opcional o una ruta nueva
versionada. Renombrar/eliminar campos, cambiar tipos, redefinir permisos o
alterar semántica de estado requiere plan de transición, pruebas de clientes y
actualización de OpenAPI/documentación. Evita responder “éxito” a un payload
que el servidor ignoró: las validaciones deben ser explícitas y observables.
