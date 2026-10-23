# Biblia del Proyecto

**MODULO — Plataforma de operaciones inmobiliarias**  
**Versión:** 1.4 · **Fecha:** 15 de octubre de 2026

## 1. Propósito y definición

Modulo es un sistema en web para la operación diaria de una inmobiliaria: la empresa que intermedia ventas y rentas de inmuebles. Su API concentra en un sistema propio:

- contactos y prospectos;
- asesores y usuarios;
- propiedades, características y fotografías;
- citas, actividad y seguimiento;
- cierres de venta o renta y comisiones estimadas;
- supervisión operativa;
- catálogo público básico;
- acceso web responsivo e instalable como PWA.

**Términos de negocio:** un prospecto es una persona interesada que todavía puede no ser cliente; un asesor atiende contactos y propiedades; una captación es incorporar un inmueble al inventario; un seguimiento es la próxima acción pendiente con un contacto; un cierre es una venta o renta concretada; y una comisión es la remuneración asociada a esa operación. CRM significa gestión de relaciones con contactos y clientes.

Su objetivo es que la inmobiliaria conserve sus datos y controle el recorrido completo, desde la primera consulta hasta el cierre, sin depender estructuralmente de franquicias, portales o proveedores.

Modulo no es un ERP ni un sistema de contabilidad ni una página web normal, pero sí registra la información comercial y económica elemental de sus operaciones. Debe ser suficientemente útil para una inmobiliaria real y suficientemente pequeño para construirse, mantenerse y ampliarse con criterio.

Esta Biblia define el producto, sus páginas, estructura de código, arquitectura, límites y criterios de aceptación. Es una especificación del resultado esperado, no un cronograma ni una asignación de tareas.

## 2. En breve

Modulo reúne en un solo lugar los contactos, asesores, inmuebles, visitas, seguimientos y cierres de una inmobiliaria. Un asesor organiza su actividad; gerencia conoce la operación y sus resultados; y el inventario interno alimenta el catálogo público sin duplicar registros. La empresa conserva la fuente de verdad y puede conectar otros servicios después.

## 3. Principios no negociables

1. Los datos y la lógica del negocio son el activo durable. La interfaz es reemplazable.
2. PostgreSQL es la fuente de verdad para la información central de Modulo.
3. Angular es un cliente de la plataforma, no el lugar donde viven las reglas críticas.
4. Las integraciones rodean al núcleo; no lo poseen. Ningún portal, calendario, servicio de mensajería o proveedor externo puede convertirse en requisito para consultar o conservar los datos centrales.
5. La marca es configuración, no arquitectura. Modulo puede usarse hoy bajo una marca y mañana bajo otra sin reconstruir el dominio.
6. Se prefiere la solución más simple y mantenible que preserve una buena arquitectura.
7. Las funcionalidades opcionales deben poder activarse o retirarse sin romper el núcleo.
8. El historial útil se conserva. Los registros comerciales importantes se archivan antes de eliminarse cuando sea razonable.
9. La portabilidad importa: los datos principales deben poder exportarse y los proveedores deben poder sustituirse.
10. Una extensión no es una prohibición. Las nuevas funciones no entran automáticamente en esta versión, pero la arquitectura debe permitir incorporarlas cuando aporten valor sin agrandar el núcleo innecesariamente.

**Prioridad ante conflictos:**

1. integridad de datos;
2. arquitectura backend;
3. seguridad y permisos;
4. flujo operacional real;
5. API;
6. usabilidad;
7. presentación visual;
8. PWA;
9. integraciones;
10. funciones experimentales.

## 4. Arquitectura

Modulo será un monolito modular con API REST.

```text
Angular / PWA / clientes futuros
              ↓
         REST API v1
              ↓
        Django + DRF
       ↙     ↓      ↘
 PostgreSQL  Storage  Integraciones
```

Habrá un solo backend Django desplegable, dividido internamente por dominio. No se usarán microservicios ni bases independientes por módulo sin una necesidad real.

### Estructura objetivo del repositorio

Modulo utiliza un monorepositorio. Las aplicaciones Django se organizan directamente en `backend/`, sin directorio intermedio `apps/`. La estructura definida es:

```text
modulo/
 ├── PROJECT_BIBLE.md          especificación fuente de verdad
 ├── README.md                 instalación y operación
 ├── backend/
 │   ├── config/               settings, urls, ASGI y WSGI
 │   ├── core/                 infraestructura compartida
 │   ├── organizations/        identidad, fuentes y ajustes
 │   ├── accounts/             usuarios, roles y perfiles
 │   ├── contacts/             contactos, intereses, actividad
 │   ├── properties/           inventario y archivos
 │   ├── appointments/         citas y resultados
 │   ├── closings/             cierres y comisiones estimadas
 │   ├── integrations/         adaptadores y exportaciones
 │   ├── manage.py
 │   ├── pyproject.toml
 │   ├── uv.lock
 │   └── .env.example
 ├── frontend/
 │   ├── src/app/
 │   │   ├── core/             auth, api, guards, modelos
 │   │   ├── layout/           shells y navegación
 │   │   ├── shared/           componentes reutilizables
 │   │   ├── features/         áreas funcionales (abajo)
 │   │   ├── app.routes.ts
 │   │   └── app.config.ts
 │   ├── public/               iconos, i18n y manifest
 │   ├── ngsw-config.json
 │   ├── package.json
 │   └── package-lock.json
 ├── infra/                     Compose, contenedores, deploy
 ├── docs/                      arquitectura, decisiones, capturas
 └── scripts/                   preparación y datos demo
```

En `frontend/src/app/features/` existirán `auth/`, `dashboard/`, `contacts/`, `properties/`, `appointments/`, `closings/`, `agents/`, `users/`, `settings/` y `catalog/`. Cada área agrupa sus páginas, componentes y servicios; los modelos compartidos, interceptores y guardas de rutas viven en `core/`. La PWA y sus borradores locales se administran desde `core/`, sin crear otro backend. Cada aplicación Django mantiene `models.py`, `migrations/` y `tests/`, e incorpora `serializers.py`, `views.py`, `urls.py` y `services.py` cuando se necesiten.

`core` aporta utilidades; `organizations` gestiona configuración y fuentes; `accounts`, usuarios; `contacts`, prospectos e intereses; `properties`, inmuebles y medios; `appointments`, citas; `closings`, operaciones concretadas; e `integrations`, adaptadores y exportaciones. Frontend y backend son aplicaciones desplegables por separado. Existe una organización inicial, no un SaaS multiempresa.

## 5. Stack tecnológico

### Frontend

- Angular 21.x
- TypeScript 5.9.x
- Node.js 22.x
- npm + `package-lock.json`
- Angular Router
- Reactive Forms
- HttpClient
- Angular Material
- SCSS/CSS + variables CSS para theming
- Transloco
- `@angular/pwa`
- Capacitor, solamente como extensión móvil posterior

### Backend

- Python 3.12
- Django 5.2 LTS
- Django REST Framework 3.18.x
- PostgreSQL 17.x
- django-filter
- OpenAPI mediante drf-spectacular
- Pillow cuando sea necesario
- uv y `uv.lock` para dependencias Python reproducibles

### Infraestructura

- Git
- Docker
- Docker Compose para desarrollo local y servicios auxiliares
- configuración mediante variables de entorno
- almacenamiento de archivos compatible con S3 en producción
- HTTPS obligatorio en producción
- infraestructura sustituible entre proveedores

### Procesamiento asíncrono

No se añadirá una cola “por si acaso”. Cuando exista una necesidad real de tareas programadas o asíncronas, la opción preferida será Celery + Valkey.

### No forman parte de la arquitectura base

Firebase/Firestore como base principal, Supabase como sustituto de Django, GraphQL, microservicios, Kubernetes, NoSQL como almacenamiento principal, lógica crítica exclusiva en Angular, servicios propietarios como fuente maestra, IA o agentes de IA.

## 6. Modelo de dominio

Los modelos podrán evolucionar, pero estas entidades y relaciones son obligatorias.

### Organización

Configuración de la inmobiliaria: nombre, branding, logotipo, zona horaria, idioma predeterminado, moneda y módulos activados.

### Usuario y perfil de asesor

Django administra autenticación y contraseñas. El perfil de asesor agrega información profesional al usuario cuando corresponda. No se implementará criptografía propia.

### Contacto

Una sola entidad representa la evolución comercial de una persona, evitando modelos duplicados para “lead”, “prospecto” y “cliente”.

**Campos mínimos:** UUID, nombre, teléfono, correo opcional, asesor responsable, origen, estado, observaciones y timestamps.

**Estados iniciales:** prospecto, cliente activo, cliente cerrado, perdido, inactivo.

### Fuente

Las fuentes de prospectos y citas son configurables: guardia, contacto personal, sitio web, recomendación, redes sociales, portales u otras.

### Propiedad

Registro maestro del inmueble. Debe incluir al menos: UUID, título, descripción, tipo, operación, precio, moneda, estado, ubicación, características, asesor responsable, visibilidad pública, medios y timestamps.

**Estados iniciales:** borrador, activa, reservada, cerrada, archivada.

La propiedad existe independientemente de su publicación externa o pública.

### Medio de propiedad

Representa fotografías u otros archivos. PostgreSQL guarda metadatos y referencia; el archivo físico vive en almacenamiento externo/local, nunca como blob principal en la base de datos.

### Cita

Incluye: asesor, fecha/hora, contacto, propiedad cuando aplique, propósito, origen, estado, resultado y seguimiento.

**Estados iniciales:** programada, confirmada, completada, cancelada, no asistió.

Operación de propiedad (venta/renta) y propósito de cita (visita/captación/cierre/otro) son conceptos distintos y no deben mezclarse.

### Interés en propiedad

Relación mínima entre contacto y propiedad (con fecha y nota opcional) para saber qué inmueble le interesa a alguien antes de que exista una cita. No crea un embudo de ventas ni una entidad de negocio compleja.

### Actividad / seguimiento

El historial de un contacto es una secuencia de actividades —notas, llamadas, resultados o cambios relevantes— y no un campo que se sobrescribe. Un seguimiento pendiente debe contar con responsable, fecha límite, estado pendiente/completado y vínculo al contacto; si se completa, permanece en el historial.

### Cierre y comisión estimada

Un cierre registra una venta o renta efectivamente concretada; no representa una cotización, intención de compra ni pago bancario. Incluye UUID, propiedad, contacto vinculado, asesor responsable, tipo de operación, fecha, monto pactado, moneda, estado (vigente o anulado) y fechas de registro. Gerencia registra o anula cierres; un cierre válido cambia la propiedad a cerrada y la retira del catálogo en una misma transacción de base de datos. Anularlo no reactiva automáticamente la publicación.

Cada cierre admite una comisión estimada atribuida al asesor principal: porcentaje pactado e importe calculado sobre el monto del cierre, con estado pendiente o `reportada_pagada`. Si todavía no se conoce el porcentaje, la estimación queda sin calcular hasta completarlo. El estado se actualiza manualmente por gerencia; no demuestra un pago real, emite facturas ni calcula nómina. Comisiones divididas, pagos parciales e impuestos se reservan para una extensión.

### Reglas transversales de datos

- UUID como identificador público de registros principales.
- `created_at` y `updated_at` en registros importantes.
- usuario responsable cuando aplique.
- estados explícitos y archivado preferente sobre borrado destructivo.
- fechas almacenadas consistentemente en UTC y presentadas según la zona horaria de la organización.
- moneda configurable; MXN puede ser el valor inicial.
- cambios de esquema exclusivamente mediante migraciones Django.

## 7. Roles, autenticación y permisos

### Asesor

Puede gestionar sus contactos, citas y seguimientos; consultar inventario permitido; y crear/modificar propiedades según permisos y responsabilidad.

### Gerencia

Puede consultar actividad global, asesores, contactos, citas, propiedades, reportes básicos y modificar información operacional cuando corresponda.

### Administrador

Incluye capacidades de gerencia y además administra usuarios, permisos, configuración y parámetros del sistema.

### Matriz de acceso predeterminada

| Acción | Asesor | Gerencia | Administrador |
|---|---|---|---|
| Contactos y citas | Propios/asignados | Todos | Todos |
| Seguimientos | Crear y cerrar propios | Ver y gestionar todos | Todos |
| Propiedades | Ver activas; crear y editar asignadas | Ver y editar todas | Todas |
| Cierres y comisiones | Consultar los atribuidos | Registrar, editar, anular y marcar comisión | Todos |
| Dashboard | Métricas propias | Métricas globales | Globales |
| Asesores | No | Consultar | Consultar |
| Usuarios, roles, ajustes | No | No | Gestionar |

La propiedad creada por un asesor se le asigna inicialmente; gerencia puede reasignarla. Un contacto recibido del sitio público queda sin asesor hasta su asignación interna. Los asesores no ven contactos ajenos ni propiedades privadas de otros. Los cierres los confirma gerencia; el asesor solo consulta sus propias operaciones y comisiones. Los cambios de permisos no se exponen a asesores.

### Reglas de seguridad

La autorización siempre se aplica en el backend. Ocultar elementos en Angular no es seguridad.

Para web/PWA se prefieren sesiones de Django con cookies seguras, HttpOnly, CSRF y HTTPS. No se guardarán credenciales o tokens sensibles en `localStorage` por conveniencia. Un cliente móvil futuro podrá usar otro mecanismo sin reemplazar el modelo de usuarios y permisos.

## 8. API y lógica de negocio

La API es parte formal de Modulo:

`/api/v1/`

Será REST, JSON, versionada, documentada con OpenAPI e independiente de Angular.

```text
Angular Component
       ↓
Frontend Service
       ↓
    REST API
       ↓
Service / Domain Logic
       ↓
    Database
```

La API debe encargarse de validación, permisos, paginación, filtrado y errores consistentes.

Las reglas importantes se centralizan en servicios de dominio (no repartidas entre views, serializers o componentes). Operaciones multi-registro usan transacciones cuando corresponda. Contratos mínimos de recursos, sin exigir una pantalla por endpoint:

- **Privados:** `/api/v1/auth/`, `/api/v1/contacts/`, `/api/v1/properties/`, `/api/v1/appointments/`, `/api/v1/closings/`, `/api/v1/dashboard/`, `/api/v1/users/`, `/api/v1/organization/`, `/api/v1/sources/`.
- **Anidados:** actividades e intereses de un contacto; medios de una propiedad; resultado y exportación `.ics` de una cita. El registro de cierre incluye su comisión estimada; no requiere API de pagos.
- **Públicos:** `/api/v1/public/properties/`, `/api/v1/public/properties/{id}/` y `/api/v1/public/inquiries/`.
- **Exportación:** CSV de contactos, propiedades y citas, exclusivamente para usuarios autorizados.

Todos los recursos privados usan UUID públicos, JSON y reglas uniformes de error/filtros/paginación. Se documentan en OpenAPI; nombres y comportamiento deben mantenerse coherentes entre frontend y backend.

## 9. Núcleo funcional

### CRM de contactos

Debe registrar, asignar, buscar y filtrar contactos; guardar origen/estado; mostrar citas, inmuebles de interés, historial y próximo seguimiento; y responder quién atiende, de dónde llegó, qué ocurrió y qué sigue.

**Filtros mínimos:** nombre, asesor, estado y origen.

### Inventario de propiedades

Debe permitir crear, consultar, actualizar, archivar, buscar, filtrar, asignar asesor, administrar fotografías, definir estado y controlar visibilidad pública.

**Filtros mínimos:** estado, asesor, operación, tipo y visibilidad.

### Citas y seguimiento

Debe crear y actualizar citas con contacto obligatorio, propiedad opcional, asesor, fecha/hora, origen, propósito, estado, resultado y seguimiento. Completar una cita exige registrar resultado; la fecha del siguiente seguimiento se guarda como actividad pendiente.

**Filtros mínimos:** periodo, asesor, estado, origen y propósito.

Una vista de agenda puede existir, pero el modelo no debe depender de una representación visual de calendario.

### Cierres y comisiones

Gerencia registra ventas o rentas concretadas, consulta sus detalles, corrige o anula registros, calcula la comisión estimada con el porcentaje acordado y marca manualmente su estado. Listado filtrable por periodo, asesor, tipo de operación y estado de comisión. El asesor puede consultar únicamente sus cierres. Crear o corregir un cierre exige una propiedad y contacto válidos, y la operación debe coincidir con la permitida para el inmueble. No se registran transferencias bancarias, cobros ni pagos reales.

### Dashboard

Muestra próximas citas, seguimientos pendientes, propiedades por estado, actividad reciente y cantidad/monto de cierres por periodo. Gerencia filtra por asesor, periodo y estado; el asesor solo ve información propia. Los montos de cierre son volumen comercial registrado, no utilidad, saldo de caja ni facturación fiscal.

No es una plataforma de BI y no incluye predicciones, scoring o forecasting con IA.

### Catálogo público

Forma parte del alcance final, pero debe permanecer desacoplable y desactivable. Consume el mismo inventario; nunca crea un inventario paralelo.

**Regla obligatoria de visibilidad pública:**

`activa + marcada como pública = visible`

Debe incluir listado, filtros básicos, ficha, fotografías e información pública. El formulario de consulta de la ficha crea un contacto con origen `sitio_web`, vincula la propiedad de interés y deja el registro sin asesor para asignación interna; exige validación, aviso de privacidad y protección básica contra abuso.

El endpoint público usa serializer específico: no expone notas, clientes, propietarios, historial, metadatos administrativos, integraciones ni datos privados de asesores. Por defecto no se expone la dirección exacta, solo ubicación pública aproximada. La publicación exige `estado=activa` y `publica=true`; al desactivar cualquiera desaparece del catálogo.

No incluye CMS general, blog, constructor de páginas, SEO avanzado, marketplace multiagencia, herramientas hipotecarias ni administración publicitaria.

## 10. Preguntas operativas que Modulo debe responder

El sistema debe responder: ¿quién es este contacto, quién lo atiende, de dónde llegó, qué propiedad le interesa, qué citas tuvo y qué sigue? También: ¿qué propiedades están activas o publicadas, qué citas y seguimientos vienen, qué ventas o rentas se cerraron y qué comisiones estimadas siguen pendientes? La información se consulta según asesor, periodo, estado y origen cuando aplique.

## 11. Frontend, idiomas y PWA

Angular se ocupa de presentación, navegación, formularios, interacción, validaciones de UX, consumo de API, responsive design e internacionalización; no de decisiones críticas del negocio.

**Reglas:**

- llamadas HTTP a través de servicios tipados, no directamente desde componentes;
- evitar estado global complejo como NgRx mientras no sea necesario;
- transformar respuestas de API en una capa apropiada cuando haga falta;
- activación de módulos centralizada;
- diseño claro, consistente, accesible y responsivo.

La interfaz tendrá español predeterminado e inglés alternativo, con cambio en tiempo de ejecución mediante claves de traducción. Los datos escritos por usuarios no requieren traducción automática.

La PWA será instalable, responsiva y servida por HTTPS. Capacidad offline obligatoria y acotada: la interfaz instalada abre sin red mediante caché de recursos estáticos, indica el estado de conexión y presenta una vista de indisponibilidad cuando una operación necesita la API. Desde esa vista, sin una ruta nueva, puede conservar borradores locales de notas de seguimiento sin vincularlos aún a contactos; al recuperar conexión, el usuario revisa el texto, selecciona el contacto y lo envía manualmente. El borrador se identifica como no enviado, puede borrarse y se elimina al cerrar sesión.

Se usará almacenamiento local específico para borradores, no para fichas privadas, credenciales, listados de contactos ni copias de la base de datos. No se promete consulta completa del CRM sin red, inicio de sesión offline, edición desconectada de citas/propiedades ni sincronización automática. El usuario recibirá una advertencia de no introducir información sensible en borradores locales.

El orden móvil será: web estable → PWA → Capacitor/Android si aporta valor. No habrá aplicaciones independientes en Kotlin, Java o Swift en esta versión; iOS podrá usar inicialmente la PWA.

## 12. Mapa definitivo de páginas y navegación

Convención: el mapa fija 24 rutas de página (4 públicas/de acceso y 20 internas); `/` es el catálogo público cuando está activado; `/login` es el acceso interno y `/app/` contiene pantallas protegidas. `:id` representa el UUID del registro, no una página distinta por registro. Formularios de alta y edición son rutas distintas, pero comparten componentes. Las tablas, filtros, pestañas, diálogos y estados vacíos no crean páginas adicionales.

### Páginas públicas y acceso

| Ruta | Página y contenido obligatorio | Acceso |
|---|---|---|
| `/` | Catálogo: inmuebles publicados, búsqueda y filtros | Público; módulo activo |
| `/propiedades/:id` | Ficha: imágenes, características y formulario de consulta | Público; módulo activo |
| `/aviso-de-privacidad` | Aviso para consultas públicas | Público |
| `/login` | Inicio de sesión del personal | Público |

### Páginas internas

| Ruta | Página y contenido obligatorio | Acceso |
|---|---|---|
| `/app/dashboard` | Indicadores, próximas citas y seguimientos | Tres roles; alcance por rol |
| `/app/contactos` | Tabla, búsqueda y filtros | Tres roles; alcance por rol |
| `/app/contactos/nuevo` | Alta de contacto | Tres roles |
| `/app/contactos/:id` | Ficha, inmuebles de interés, citas y actividades | Autorizado sobre registro |
| `/app/contactos/:id/editar` | Edición de contacto | Autorizado sobre registro |
| `/app/propiedades` | Inventario, filtros y estados | Tres roles; alcance por rol |
| `/app/propiedades/nueva` | Alta de inmueble | Tres roles |
| `/app/propiedades/:id` | Ficha interna, medios y estado | Autorizado sobre registro |
| `/app/propiedades/:id/editar` | Edición, imágenes y visibilidad | Autorizado sobre registro |
| `/app/citas` | Lista, periodo, filtros y resultados | Tres roles; alcance por rol |
| `/app/citas/nueva` | Programación de cita | Tres roles |
| `/app/citas/:id` | Detalle, resultado y seguimiento | Autorizado sobre registro |
| `/app/citas/:id/editar` | Edición de cita | Autorizado sobre registro |
| `/app/cierres` | Listado y filtros de ventas/rentas concretadas | Tres roles; solo registros propios para asesor |
| `/app/cierres/nuevo` | Registro de cierre y comisión estimada | Gerencia y administración |
| `/app/cierres/:id` | Detalle de cierre y estado de comisión | Autorizado sobre registro |
| `/app/cierres/:id/editar` | Corrección, anulación y comisión | Gerencia y administración |
| `/app/asesores` | Directorio y actividad por asesor | Gerencia y administración |
| `/app/usuarios` | Altas, activación y roles de acceso | Solo administración |
| `/app/configuracion` | Organización, marca, fuentes y módulos | Solo administración |

**Navegación:** al iniciar sesión se abre `/app/dashboard`; `/app` redirige al dashboard. Toda ruta privada exige sesión; se usa respuesta 403 sin permiso y 404 para una ruta inexistente, sin divulgar datos. Cerrar sesión regresa a `/login` y borra los borradores locales. Con el catálogo desactivado, `/` dirige a `/login` y sus fichas dejan de estar disponibles. La pantalla offline y los estados 403/404 son estados del sistema, no módulos de negocio adicionales. No se incluyen páginas separadas de calendario visual, contabilidad, pagos, facturación, pipeline ni chat.

## 13. Archivos, ambientes y despliegue

### Fotografías

En desarrollo pueden almacenarse localmente. En producción se utilizará almacenamiento compatible con S3, desacoplado del proveedor.

### Ambientes

Como mínimo: desarrollo y producción; staging puede agregarse cuando sea necesario. Las diferencias se resuelven mediante variables de entorno.

Nunca se versionan secretos, contraseñas, claves privadas, credenciales o API keys reales.

### Despliegue

La arquitectura de producción será conceptualmente:

```text
Internet / HTTPS
        ↓
Frontend Angular + /api/
        ↓
      Django
     ↙      ↘
PostgreSQL  Object Storage
```

Para uso real se priorizan respaldo y restauración comprobables de PostgreSQL, almacenamiento persistente para fotos y HTTPS antes que funciones accesorias. El README documenta instalación, variables, migraciones, datos de demostración, pruebas, compilación y despliegue.

## 14. Integraciones e interoperabilidad

Todas las integraciones viven detrás de adaptadores en `integrations/`. No se harán llamadas directas a proveedores desde modelos de dominio o componentes Angular.

**Orden recomendado de incorporación:**

1. Exportación obligatoria: CSV para contactos, propiedades y citas.
2. Calendario local obligatorio: exportación `.ics` de citas.
3. Email transaccional: mediante mecanismo desacoplado del proveedor.
4. APIs de calendario: Google/Microsoft mediante adaptadores.
5. Notificaciones push.
6. WhatsApp/SMS, si el negocio justifica costo y políticas externas.
7. Portales inmobiliarios, solamente con API/documentación oficial, acceso autorizado y condiciones claras.

No se hará scraping como sustituto de una API autorizada.

Una referencia externa de propiedad debe almacenar por separado proveedor, ID externo, estado de publicación, última sincronización y último error. Un ID externo nunca sustituye al UUID interno.

**Reglas de independencia:**

- CRM no depende del catálogo público.
- inventario no depende de un portal.
- citas no dependen de Google Calendar.
- contactos no dependen de WhatsApp.
- backend no depende de Angular para reglas de negocio.
- identidad de organización no depende de una marca o franquicia concreta.

## 15. Seguridad, privacidad e historial

Antes de utilizar datos reales, Modulo debe contar como mínimo con:

- HTTPS;
- contraseñas gestionadas por Django;
- permisos aplicados en backend;
- CSRF y cookies seguras cuando corresponda;
- validación de entrada;
- CORS restringido correctamente;
- secretos por variables de entorno;
- validación de tipo y tamaño de archivos;
- endpoints privados protegidos;
- consultas limitadas según permisos;
- respaldos;
- manejo de errores sin exponer información sensible.

Los datos de desarrollo deben ser sintéticos o anonimizados. No se copiará indiscriminadamente una base real de clientes a entornos de desarrollo o demos públicas.

No se requiere una plataforma de auditoría empresarial completa, pero los registros importantes deben conservar creación, modificación y responsable cuando sea relevante, evitando pérdida accidental de historial.

Antes de operar formalmente con datos reales deberá realizarse una revisión adicional de privacidad, protección de datos y obligaciones legales aplicables.

## 16. Calidad y pruebas

### Backend

Tiene prioridad en pruebas automatizadas. Deben protegerse especialmente:

- autenticación y permisos;
- validaciones;
- creación y actualización;
- filtros;
- reglas de citas y seguimientos;
- cierre de operaciones, comisiones y coherencia del inventario;
- publicación y retirada del catálogo;
- límites de acceso a borradores y comportamiento offline;
- endpoints públicos;
- protección de información privada.

No se perseguirá un porcentaje de cobertura artificial; se protegen reglas y flujos importantes.

### Frontend

Debe probar al menos servicios importantes, guards, transformaciones críticas y comportamiento propenso a romperse. Podrán añadirse pruebas end-to-end para los flujos principales.

### Criterios para considerar una función terminada

Una funcionalidad se considera terminada cuando, según corresponda:

- funciona y persiste correctamente;
- valida entradas;
- aplica permisos;
- maneja errores razonables;
- se integra con navegación y API;
- funciona en tamaños de pantalla esperados;
- usa internacionalización para texto fijo;
- tiene pruebas cuando contiene reglas críticas;
- comunica claramente si opera sin conexión y si un borrador no se ha enviado;
- no introduce secretos ni rompe otros módulos.

## 17. Capacidades transversales obligatorias

Los módulos centrales comparten búsqueda y filtros; responsables; estados e historial; archivado preferente sobre borrado; validación y permisos en backend; paginación; separación de datos públicos y privados; y exportación de contactos, propiedades, citas y cierres. Los importes se guardan con precisión decimal y moneda explícita; los borradores offline nunca son fuente de verdad.

## 18. Alcance final obligatorio

Modulo se considera funcionalmente completo cuando existan:

### Backend

- Django + PostgreSQL operativos;
- API REST v1 y OpenAPI;
- usuarios, perfiles y permisos;
- contactos, intereses y seguimientos con vencimiento;
- propiedades y fotografías;
- citas, actividad y seguimiento;
- cierres y comisiones estimadas con permisos y consistencia transaccional;
- filtros;
- endpoints públicos controlados;
- pruebas de reglas importantes.

### Frontend

- login;
- dashboard;
- gestión de contactos;
- gestión de propiedades;
- gestión de citas;
- listado, alta y detalle/edición de cierres;
- catálogo público básico y formulario de consulta;
- pantallas de asesores, usuarios y configuración según rol;
- español/inglés;
- diseño responsivo.

### Distribución y operación

- aplicación web;
- PWA instalable con interfaz offline y borrador local manual;
- configuración por variables de entorno;
- migraciones reproducibles;
- datos demo reproducibles;
- proceso documentado de ejecución y despliegue;
- exportación CSV de datos centrales, `.ics` de citas y respaldo documentado.

### Flujos que deben funcionar de extremo a extremo

1. **Contacto:** crear → asignar asesor/origen → asociar inmueble de interés → registrar actividad/pendiente.
2. **Propiedad:** crear → completar información/fotos → asignar → activar/archivar.
3. **Cita:** asociar contacto/propiedad/asesor → programar → actualizar resultado → seguimiento.
4. **Supervisión:** iniciar sesión → dashboard → filtrar → abrir registros relacionados.
5. **Cierre:** registrar venta/renta → vincular asesor/contacto/propiedad → calcular comisión → cerrar y retirar inmueble del catálogo.
6. **Publicación:** propiedad activa → marcar pública → consultar ficha → generar contacto → desactivar → desaparecer.
7. **Idioma:** español → cambiar a inglés → interfaz actualizada.
8. **PWA offline:** instalar → cargar con red → desconectar → abrir interfaz → guardar borrador → reconectar → revisar y enviarlo manualmente.

## 19. Extensiones y límites del producto

### Capacidades futuras compatibles con la arquitectura

- Android mediante Capacitor; correo transaccional y recordatorios automáticos;
- calendarios externos, notificaciones push, WhatsApp Business y portales autorizados;
- sincronización offline de registros con resolución de conflictos, si el uso real lo justifica;
- comisiones divididas, pagos parciales, gastos y reportes comerciales más avanzados;
- integraciones de cobro, facturación fiscal y contabilidad, sin reemplazar sus sistemas especializados;
- documentos, firmas, importaciones masivas, automatizaciones y múltiples oficinas.

### Límites de la primera versión

La versión definida sí incluye cierres y estimación/seguimiento manual de comisiones, pero no procesa dinero, no registra libros contables ni emite facturas fiscales. También incluye un modo offline limitado, no una réplica local del CRM. Estas capacidades más amplias podrán agregarse mediante módulos o integraciones cuando tengan un caso de uso concreto.

### No objetivos estructurales

- ERP generalista, nómina o contabilidad completa como núcleo de Modulo;
- IA, agentes o automatizaciones predictivas como fundamento del producto;
- contratos y firmas electrónicas de extremo a extremo en esta versión;
- marketplace multiempresa, red social, chat interno o suite de marketing;
- CMS/blog/SEO avanzado y constructor de páginas;
- scraping de portales o conexiones sin autorización;
- aplicaciones móviles nativas independientes;
- microservicios y SaaS multiempresa completo;
- recopilación innecesaria de datos personales sensibles.

## 20. Durabilidad y criterio de supervivencia

Modulo debe seguir siendo útil aunque cambien Angular, la marca, los portales, el almacenamiento o el despliegue. Deben sobrevivir sin reconstrucción: modelos y migraciones, usuarios y permisos, contactos, propiedades, citas, cierres y comisiones registradas, historial, lógica de dominio, API/OpenAPI, pruebas y mecanismos de intercambio de datos.

## 21. Criterio para decisiones nuevas

Antes de agregar una característica o dependencia importante, debe responderse:

1. ¿Resuelve un problema real observado?
2. ¿Pertenece al núcleo o puede vivir como módulo?
3. ¿Introduce un proveedor sin el cual dejaría de funcionar el núcleo?
4. ¿Duplica información o crea otra fuente de verdad?
5. ¿Puede agregarse después sin perder información ni bloquear el diseño?
6. ¿Desplaza trabajo más importante?
7. ¿La plataforma base ya resuelve suficientemente el problema?
8. ¿La dependencia está mantenida, tiene licencia aceptable y puede sustituirse?
9. ¿Estamos resolviendo una necesidad real o ampliando innecesariamente el alcance?

La preferencia general es por tecnologías abiertas, estándares documentados y dependencias justificadas. Los niveles gratuitos de proveedores sirven para desarrollo o demostración; no son una arquitectura. Si se opera con datos reales, el primer presupuesto cubre hosting estable, base de datos y respaldos, almacenamiento y HTTPS; ninguna extensión comercial tiene precedencia sobre eso.

**Regla final:** cuando haya que elegir entre agregar otra función o hacer profesional, segura y reutilizable la funcionalidad central existente, se prioriza la segunda.
