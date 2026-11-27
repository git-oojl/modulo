# Modelo de datos del backend

Este documento describe el modelo persistente implementado en Django. Es una
guía de diseño y mantenimiento; la definición ejecutable sigue siendo los
modelos y las migraciones de `backend/`. Para el alcance funcional se consulta
primero la [Biblia](../PROJECT_BIBLE.md).

## Convenciones transversales

La mayoría de registros operativos heredan de `UUIDTimeStampedModel`:

- `id` es UUID, se genera en el servidor y es la identidad que se expone por
  API.
- `created_at` y `updated_at` registran creación y última modificación.
- Los UUID nunca se reciclan ni se usan como un código comercial visible.
- Las relaciones que protegen historial usan `PROTECT`; borrar la entidad
  relacionada falla en lugar de dejar historia ambigua.

Los catálogos de Django y las tablas de sesión no se detallan aquí. No se
versionan filas de PostgreSQL: las migraciones definen esquema y `seed_demo`
aporta datos sintéticos repetibles.

## Mapa de relaciones

```text
User ───────< Contact ───────< ContactActivity
  │              │  └────────< FollowUp
  │              └───────────< PropertyInterest >──────── Property ───< PropertyMedia
  │                                      │                       │
  ├──────< Appointment >─────────────────┘                       └──< Closing >── CommissionEstimate
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘

Organization ───< LeadSource ───< Contact / Appointment
```

`User` no es un cliente CRM: es la identidad de quien opera el sistema. Un
prospecto, comprador, vendedor o arrendatario se representa como `Contact`.

## Identidad y organización

### `accounts.User`

Extiende el usuario de Django. Conserva usuario, nombre, apellido, correo,
estado activo y contraseña con el mecanismo seguro de Django. Agrega:

| Campo | Propósito |
| --- | --- |
| `public_id` | UUID único usado por contratos de usuario y asignaciones. |
| `role` | `asesor`, `gerencia` o `administrador`. |

Los roles no reemplazan `is_superuser`; una cuenta superusuaria cuenta como
gerencia/administración para permisos internos. No se debe exponer hash de
contraseña, flags internos ni datos personales innecesarios en serializers.

### `accounts.AdvisorProfile`

Es una relación uno a uno opcional para un asesor. Almacena teléfono, número de
licencia y si el perfil de asesor permanece activo. Se crea al crear usuarios
con rol `asesor`; un usuario de gerencia o administración no requiere perfil.

### `organizations.Organization`

Representa la operación inmobiliaria del despliegue: nombre comercial y legal,
logo, zona horaria, idioma, moneda y el interruptor del catálogo público. El
modelo impone una sola organización inicial. La marca es configuración; no
debe codificarse en propiedades, contactos ni servicios de cierre.

### `organizations.LeadSource`

Catálogo de origen de prospectos y citas. Tiene nombre único, estado activo y
orden. Borrar una fuente deja `NULL` en registros históricos, para no borrar
contactos ni citas. La semilla garantiza la fuente `sitio_web` para consultas
públicas.

## CRM: contacto e historial

### `contacts.Contact`

Es el registro CRM estable durante todo el ciclo comercial. No se crea una
tabla distinta para “lead” y otra para “cliente”.

| Grupo | Campos |
| --- | --- |
| Identificación | `name`, `phone`, `email` opcional. |
| Responsabilidad | `advisor` opcional, protegido ante borrado. |
| Captación | `source` opcional, nulificable si se elimina la fuente. |
| Estado | `prospecto`, `cliente_activo`, `cliente_cerrado`, `perdido`, `inactivo`. |
| Contexto | `notes` y relaciones de historial. |

Una eliminación REST no borra la fila: cambia el estado a `inactivo`. Los
cambios de estado hechos por la API generan una actividad de tipo
`cambio_estado`. Las notas sensibles siguen siendo privadas: nunca van al
serializer público del catálogo.

### `contacts.ContactActivity`

Es la bitácora cronológica de interacción. Relaciona contacto, tipo, contenido,
fecha efectiva y usuario creador opcional. Los tipos son `nota`, `llamada`,
`correo`, `cambio_estado`, `cita` u `otro`. Al borrar un contacto se permite
eliminar su historial porque deja de existir el registro CRM que lo justifica;
la API normal evita ese borrado directo.

### `contacts.FollowUp`

Representa trabajo pendiente, no un recordatorio de interfaz. Tiene contacto,
persona asignada, vencimiento, nota, estado y metadatos de completado. Solo
`pendiente` y `completado` son estados válidos. El índice
`(assigned_to, status, due_at)` mantiene eficientes las bandejas de trabajo y
el dashboard.

Completar conserva la fila, registra `completed_at` y `completed_by`. No se
borra la evidencia de que la tarea existió.

### `contacts.PropertyInterest`

Une un contacto con un inmueble y admite una nota. La restricción única
`(contact, property)` evita intereses duplicados para el mismo par. Solo se
debe crear respecto de una propiedad visible al actor y todavía operable; el
serializer y la vista son responsables de aplicar la visibilidad actual.

## Inventario inmobiliario

### `properties.Property`

Es el inventario maestro, no una ficha desechable de catálogo. Sus campos se
agrupan así:

| Grupo | Campos principales |
| --- | --- |
| Descripción | `title`, `description`, `type`, `features`. |
| Operación | `operation` (`venta` o `renta`), `price`, `currency`. |
| Ciclo | `status`, `is_public`, asesor responsable. |
| Ubicación | país, estado, ciudad, colonia, dirección y `public_location`. |
| Atributos | recámaras, baños, estacionamientos, área construida y terreno. |

Los tipos actuales son casa, departamento, terreno, oficina, comercial y otro.
Los estados son `borrador`, `activa`, `reservada`, `cerrada` y `archivada`.

### Invariantes de propiedad

1. Una propiedad pública debe estar activa. La validación existe en serializer
   y como `CheckConstraint` de PostgreSQL.
2. Una propiedad se vuelve `cerrada` al registrar un cierre mediante el
   servicio de dominio; no mediante un PATCH normal.
3. Anular un cierre no reactiva ni republica la propiedad automáticamente. Esa
   decisión requiere una operación explícita y trazable.
4. El DELETE REST es archivado: cambia a `archivada` y deshabilita publicación.
5. El catálogo público usa `public_location`, nunca `address` ni información
   de responsable.

Los índices `(status, operation)` y `(advisor, status)` atienden los listados
operativos más comunes. Antes de añadir un índice se debe medir la consulta y
crear una migración específica.

### `properties.PropertyMedia`

Guarda metadatos y ruta de un archivo, no el binario dentro de PostgreSQL. Cada
medio conoce su propiedad, texto alternativo, orden y si es portada. La
validación actual acepta JPEG, PNG, WEBP y PDF hasta 10 MB. El almacenamiento
concreto puede evolucionar (volumen local, bucket privado, CDN), siempre que el
modelo conserve esa separación.

## Agenda y resultado comercial

### `appointments.Appointment`

Conecta un contacto, asesor obligatorio y, opcionalmente, una propiedad y
fuente. Registra propósito, estado, horario, resultado y notas.

| Campo de control | Valores |
| --- | --- |
| `purpose` | `visita`, `captacion`, `cierre`, `otro`. |
| `status` | `programada`, `confirmada`, `completada`, `cancelada`, `no_asistio`. |

`ends_at`, si existe, debe ser posterior a `starts_at`. Una cita completada
exige `result`; la transición se hace mediante el servicio
`complete_appointment`, que bloquea el registro, guarda el resultado, crea una
actividad del contacto y puede crear un seguimiento en una transacción.

Un DELETE REST cambia la cita a `cancelada`; no borra el evento. Hay índices
por asesor/fecha y estado/fecha para agenda y reportes operativos.

## Cierres y comisión

### `closings.Closing`

Registra el resultado económico de una propiedad y un contacto. Guarda
inmueble, contacto, asesor, operación, fecha, importe, moneda, notas y estado
`vigente` o `anulado`.

La restricción condicional `one_current_closing_per_property` permite solo un
cierre vigente por inmueble. Relaciones a propiedad, contacto y asesor son
`PROTECT`, porque una vez registrado un cierre no debe perder sus referencias.

Registrar un cierre bloquea la propiedad, verifica que su operación coincida,
crea la comisión y retira el inmueble del catálogo en una única transacción.
Anularlo conserva la evidencia y la persona/fecha de anulación. Corregir un
cierre vigente mantiene esos mismos invariantes y recalcula la comisión si
cambia el importe.

### `closings.CommissionEstimate`

Es uno a uno con cierre. Contiene porcentaje opcional, importe calculado y
estado `pendiente` o `reportada_pagada`. Cuando hay porcentaje, el importe se
calcula a partir del monto del cierre y se redondea con la precisión monetaria
de este. No sustituye contabilidad formal ni una integración financiera.

## Retención, borrado y corrección

| Recurso | DELETE de API | Conservación |
| --- | --- | --- |
| Contacto | Lo deja `inactivo`. | Historial CRM mientras existe el contacto. |
| Propiedad | La archiva y despublica. | Inventario, intereses y cierres. |
| Cita | La cancela. | Resultado y agenda histórica. |
| Cierre | No permitido; se anula. | Operación y trazabilidad económica. |
| Medio | Puede eliminarse por responsable autorizado. | La referencia se elimina; no afecta la propiedad. |

No agregues borrado físico por comodidad. Si aparece una obligación de
privacidad, retención fiscal o anonimización, se debe definir en la Biblia y
modelar como política explícita con migraciones, auditoría y pruebas.
