# API de Modulo

La API de Modulo vive bajo `/api/v1/`, usa JSON y sesiones de Django. Los recursos privados requieren sesión y protección CSRF; las rutas públicas se habilitan explícitamente. El esquema navegable se sirve en `/api/v1/schema/` y `/api/v1/docs/`.

## Autenticación y administración

- `GET /auth/csrf/`: prepara la cookie CSRF para el cliente web.
- `POST /auth/login/`, `POST /auth/logout/`, `GET /auth/me/`: ciclo de sesión del personal.
- `/users/`: gestión de usuarios, exclusiva de administración.
- `/agents/`: directorio de asesores para gerencia y administración.
- `/organization/`: consulta de organización; `PATCH` exclusivo de administración.
- `/sources/`: catálogo configurable de fuentes; modificación exclusiva de gerencia y administración.

## Operación privada

- `/contacts/`: contactos, con filtros `q`, `status`, `advisor` y `source`.
  - `/{id}/activities/`, `/{id}/interests/` y `/{id}/follow-ups/` conservan el historial.
  - `/{id}/follow-ups/{follow_up_id}/complete/` completa un seguimiento sin eliminarlo.
- `/properties/`: inventario, con filtros `q`, `status`, `operation`, `type`, `advisor` e `is_public`.
  - `DELETE` archiva la propiedad y la retira del catálogo; no borra su historial.
  - `/{id}/media/` administra referencias a archivos, nunca blobs en PostgreSQL.
- `/appointments/`: citas, filtrables con `from`, `to`, `advisor`, `status`, `purpose` y `source`.
  - `/{id}/complete/` exige un resultado y puede crear un seguimiento pendiente en la misma transacción.
  - `/{id}/ics/` descarga la cita como calendario local.
- `/closings/`: cierres y comisión estimada. Solo gerencia/administración registra, corrige, anula o actualiza comisión; un cierre vigente cierra la propiedad y despublica el inventario en una transacción. `/{id}/void/` no vuelve a publicar la propiedad.
- `/dashboard/`: resumen de actividad delimitado al rol del usuario.
- `/integrations/exports/{contacts|properties|appointments}/`: CSV autorizado y portable.

Los asesores reciben únicamente sus contactos, citas, seguimientos y cierres; pueden consultar propiedades activas y editar las asignadas. Gerencia ve la operación completa y administración gestiona identidad y configuración.

## Catálogo público

- `/public/properties/` y `/public/properties/{id}/` solo muestran propiedades con `status=activa` e `is_public=true`, y solo mientras la organización tenga habilitado el catálogo.
- `POST /public/inquiries/` crea un contacto sin asesor, con fuente `sitio_web`, y un interés sobre la propiedad. Exige aceptación de privacidad y está limitado a 10 solicitudes por hora por IP.

El serializer público excluye dirección exacta, notas, historial, datos de contacto, responsable e información administrativa.
