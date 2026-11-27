# Decisiones técnicas

Estas son decisiones ya tomadas para evitar que cada cambio reabra preguntas
de arquitectura. No sustituyen la Biblia; registran el porqué técnico y el
criterio para evolucionar el código.

## Monolito modular, no microservicios

Módulo usa una API Django desplegable con aplicaciones de dominio, PostgreSQL y
un cliente Angular separado. El tamaño actual de equipo, la necesidad de
transacciones entre CRM, inventario y cierres, y una sola fuente de verdad no
justifican despliegues, colas ni bases independientes por módulo.

La separación se expresa en apps (`contacts`, `properties`, `appointments`,
`closings`, etc.), servicios y permisos. Extraer un servicio futuro exige un
contrato estable, propietario operativo y estrategia de consistencia; no se
hace como una reorganización estética.

## PostgreSQL como persistencia normal

PostgreSQL 17 es la base para desarrollo normal y despliegue. Se usa Docker
Compose para reducir diferencias de entorno. SQLite solo puede activarse como
arnés aislado de pruebas rápidas, nunca como argumento de compatibilidad de
producción.

Consecuencia: consultas, restricciones, migraciones y pruebas importantes
deben mantenerse compatibles con PostgreSQL. No se modifica el esquema con
`psql`; Django y sus migraciones son la historia reproducible del esquema.

## UUID externos y claves internas estables

Los registros operativos usan UUID como clave primaria. Evitan enumeración
trivial y permiten exponer referencias sin acoplar la API a secuencias
incrementales. Las cuentas además tienen `public_id` para los contratos de
usuario y asignación.

Los UUID no constituyen autenticación ni sustituyen autorización. Todo acceso
se filtra con querysets y permisos del backend.

## Sesión Django y CSRF para clientes web

La API privada usa la sesión de Django, cookie HttpOnly y CSRF. Angular obtiene
la cookie desde `/api/v1/auth/csrf/` y manda el token en `X-CSRFToken` para
operaciones de escritura. No se guardan tokens de acceso ni contraseñas en
`localStorage`.

La autenticación puede evolucionar para otros clientes si existe una necesidad
concreta, pero no se debe añadir JWT paralelamente sin definir revocación,
rotación, CORS, almacenamiento y contrato de clientes.

## Autorización cerca de los datos

Los roles son asesor, gerencia y administración. La visibilidad se impone con
funciones de alcance (`scoped_*_queryset`) y comprobaciones de mutación; un
componente oculto de Angular no es una barrera de seguridad. Gerencia y
administración ven la operación completa; un asesor maneja lo asignado y puede
consultar inventario activo conforme al alcance definido.

Agregar un rol no es solo una etiqueta: requiere matriz de permisos, querysets,
acciones, tests y una decisión de producto en la Biblia.

## Servicios para transiciones con efectos múltiples

Completar una cita o registrar/corregir/anular un cierre usa funciones en
`services.py` con `transaction.atomic` y, cuando corresponde,
`select_for_update`. Así se evita que dos peticiones dejen inventario, historial
y comisión en estados incompatibles.

Los serializers validan forma e invariantes locales. Las views resuelven
autorización y transporte HTTP. La regla que cambia varios modelos no debe
repartirse entre frontend, signals implícitas y PATCHes independientes.

## Contratos públicos separados

El catálogo público no reutiliza los serializers privados. Expone solo
propiedades activas y publicadas mientras la organización lo habilite; omite
dirección exacta, notas, responsables e historial. Las solicitudes públicas se
limitan por IP y exigen aceptación de privacidad.

Toda nueva salida pública requiere revisión explícita de campos. “Ya viene en
el serializer interno” no es motivo para exponerla.

## Archivos fuera de la base de datos

PostgreSQL conserva referencias y metadatos de medios. Los binarios los gestiona
el almacenamiento de Django. Esta decisión permite mover de disco local a
objeto/CDN sin migrar blobs ni hacer crecer backups de la base de forma
incontrolada.

El backend valida tipo y tamaño, pero una operación productiva deberá añadir
antivirus, límites de almacenamiento, URLs privadas/presignadas y política de
retención antes de aceptar documentos reales.

## Integraciones como bordes, no propietarios

Las exportaciones CSV viven en `integrations/`. Un proveedor de correo,
calendario, firma, anuncios o mensajería debe adaptarse en ese borde; no se
debe usar su ID como llave primaria ni permitir que posea el historial CRM.
La [guía de integraciones](EXTERNAL_INTEGRATIONS.md) establece qué debe
definirse antes de conectar una.

## Dependencias y runtimes fijados

Python se administra con uv y `uv.lock`; Node/npm con Volta y
`package-lock.json`. Esto hace que una instalación reproducible use versiones
conocidas. Cambiar una dependencia exige cambiar su manifiesto y lockfile,
revisar seguridad/compatibilidad y actualizar documentación si modifica el
contrato operativo.

## Evolución de documentación

OpenAPI es el contrato ejecutable de las rutas; estas guías explican intención,
operación y decisiones. Cuando un cambio modifica una API o modelo estable se
actualizan ambos. No se documentan recorridos de pantallas que aún están en
movimiento como si fueran arquitectura definitiva.
