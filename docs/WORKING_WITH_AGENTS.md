# Cómo trabajar con una IA en este repositorio

Esta guía está dirigida a una IA conversacional que no tiene acceso directo al
checkout: ChatGPT, una conversación con un diseñador/desarrollador asistido u
otra herramienta a la que le pegarás archivos. No hace falta enviar el ZIP
completo en cada consulta. Dale el contexto mínimo que define la pantalla, el
contrato y las reglas que no debe romper.

Para un agente que sí puede ejecutar comandos y modificar el repositorio,
comparte también [AGENT_OPERATING_GUIDE.md](AGENT_OPERATING_GUIDE.md). Esa guía
añade runtime, comandos, seguridad local y disciplina de commits; esta se
concentra en el paquete de contexto para conversar bien sobre un cambio.

## Paquete mínimo para una vista Angular

Comparte estos archivos o sus fragmentos relevantes:

1. [frontend/README.md](../frontend/README.md): reglas generales de
   integración, sesión, proxy y estructura.
2. El componente de la vista que quieres modificar y, si aplica, el template,
   estilos y componentes cercanos.
3. [app.routes.ts](../frontend/src/app/app.routes.ts), las rutas del feature y
   el shell o layout que contiene la ruta.
4. El servicio data-access de ese feature y sus modelos TypeScript.
5. [api-client.service.ts](../frontend/src/app/core/api/api-client.service.ts).
6. El fragmento relevante de [API_BACKEND.md](API_BACKEND.md), o el OpenAPI
   correspondiente si el contrato es más preciso.

Describe además qué debe lograr la pantalla, qué no debe cambiar y si la IA
puede modificar backend o sólo la interfaz. La instrucción base es:

> Usa los servicios y contratos existentes. No crees llamadas HTTP directas en
> componentes, no inventes estados de negocio y no conviertas reglas visuales
> en permisos.

## Archivos adicionales según el tipo de tarea

| Tipo de tarea | Contexto adicional que debes compartir |
| --- | --- |
| Login, sesión o cierre de sesión | [auth.service.ts](../frontend/src/app/core/auth/auth.service.ts), [auth.models.ts](../frontend/src/app/core/auth/auth.models.ts), [app.config.ts](../frontend/src/app/app.config.ts) y la sección de sesión/CSRF de [API_BACKEND.md](API_BACKEND.md). |
| Ruta protegida o permisos | [auth.guard.ts](../frontend/src/app/core/auth/auth.guard.ts), [role.guard.ts](../frontend/src/app/core/auth/role.guard.ts), la entrada exacta de route data en app.routes/feature routes y la matriz de roles de [API_BACKEND.md](API_BACKEND.md). |
| Crear, editar o listar datos de un dominio | El servicio data-access y modelo del feature, el serializer/endpoint documentado y los filtros/estados aplicables de API_BACKEND.md. |
| Acción irreversible o transición de estado | Endpoint de acción específico, servicio backend y la regla de DATA_MODEL.md/PROJECT_BIBLE.md. Ejemplos: completar cita, archivar propiedad, registrar o anular cierre. |
| Forma visual antes de backend | La vista, template, estilos, modelos de presentación y datos demo ya cercanos. Indica expresamente que debe conservarse como maqueta y qué interfaz de servicio se conectará después. |
| Estados de carga, vacío, error o éxito | La vista, su servicio data-access, modelo de respuesta paginada y pruebas cercanas. No pidas que cree un “estado global” nuevo sin decirlo: Módulo no tiene todavía un componente universal que sustituya el estado del feature. |
| Catálogo público | PublicCatalogueApiService, modelos públicos del catálogo, datos demo del catálogo si se usan y las secciones públicas de API_BACKEND.md. No compartas modelos privados de inventario como si fueran contrato público. |
| Dev Switcher o preview local | [dev-view.registry.ts](../frontend/src/app/core/dev-tools/dev-view.registry.ts), [dev-view-switcher.component.ts](../frontend/src/app/core/dev-tools/dev-view-switcher.component.ts), [development-preview.storage.ts](../frontend/src/app/core/auth/development-preview.storage.ts), [backend-health.service.ts](../frontend/src/app/core/dev-tools/backend-health.service.ts), AuthService y FeatureFlagsService. |
| Cambio de contrato API | API_BACKEND.md, serializer, view, urls, permisos, servicio de dominio y pruebas de backend afectados; además el servicio/modelo Angular que consume la respuesta. |
| Modelo, migración o regla de dominio | DATA_MODEL.md, sección relevante de PROJECT_BIBLE.md, modelo, migración previa, serializer, servicio, permisos y tests del dominio. |
| PostgreSQL, backup o datos locales | POSTGRESQL.md, infra/compose.yaml, backend/.env.example y el comando/consulta exacta que se quiere ejecutar. Nunca pegues un .env real o dump en el chat. |
| Seed o datos de demostración | DATA_DEMO.md, seed_demo.py, modelos que debe crear y los requisitos de idempotencia. |
| Sólo documentación | Documento que hay que ampliar, índice docs/README.md y fuente técnica que lo respalda. Indica claramente que no debe modificar código. |

## Paquete mínimo para backend

Para pedir una regla de backend sin que la IA tenga el repo completo, comparte:

1. La sección de la Biblia que autoriza la regla.
2. [BACKEND_GUIDE.md](BACKEND_GUIDE.md) y la sección aplicable de
   [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md).
3. El modelo, serializer, view, urls, permisos y test más cercanos.
4. [DATA_MODEL.md](DATA_MODEL.md) y [API_BACKEND.md](API_BACKEND.md) si el
   cambio toca persistencia o un contrato.
5. La instrucción explícita de si puede crear migración, pruebas, docs y commit.

Para una integración externa, agrega
[EXTERNAL_INTEGRATIONS.md](EXTERNAL_INTEGRATIONS.md). La IA debe saber si se
trata de una exportación local, un proveedor nuevo o sólo una propuesta: no
debe inventar credenciales, keys ni una llamada de red en un modelo Django.

## Cómo formular el encargo

Un encargo útil evita que la IA decida producto, arquitectura y alcance por
omisión:

~~~text
Resultado observable:
Alcance permitido:
Contexto adjunto:
Reglas de negocio y privacidad:
Contrato API disponible o faltante:
Validación esperada:
Límites explícitos:
~~~

Ejemplo para una vista:

> Resultado: conecta el listado de contactos al endpoint existente y muestra
> paginación, vacío y error. Alcance: sólo el feature contacts y sus pruebas.
> Contexto: adjunto la vista, ContactsApiService, modelos, rutas y API_BACKEND.
> No modifiques backend, no hagas HTTP directo desde el componente y no
> supongas que un asesor puede ver contactos ajenos. Reporta cualquier campo
> que el backend no exponga.

Ejemplo para forma visual previa a API:

> Implementa sólo el estado visual de la ficha pública usando el modelo de
> presentación adjunto. No agregues endpoint, no modifiques autenticación ni
> presentes datos de demo como contrato final. Deja una interfaz de servicio
> clara para sustituir el origen local cuando el endpoint esté listo.

Ejemplo para backend:

> Implementa esta regla de cierre permitida por la Biblia. Adjunté modelo,
> servicio, serializer, view, permisos y tests. Puedes crear migración y
> pruebas; no cambies frontend ni dependencias. Conserva la transacción y
> actualiza DATA_MODEL y API_BACKEND si cambia el contrato.

## Qué debe devolver una IA

Pide una respuesta que separe hechos, supuestos y pendientes:

- qué modificó y por qué;
- qué archivos necesita crear/modificar;
- qué contrato API usa o qué dato falta;
- reglas/roles que preservó;
- validaciones o pruebas realizadas;
- riesgos, decisiones de producto o bloqueos que requieren respuesta humana.

Una IA conversacional no debe afirmar que ejecutó pruebas, abrió rutas o
verificó la base si sólo recibió fragmentos. Puede proponer comandos, pero debe
marcarlos como pendientes de ejecutar.

## Límites que conviene declarar siempre

- No copiar secretos, cookies, tokens, .env reales, dumps ni datos personales
  en el chat.
- No asumir que una ruta, un mock, una maqueta o el Dev Switcher define una
  regla final de negocio.
- No agregar dependencias ni modificar lockfiles sin solicitarlo.
- No crear endpoints o campos “por si acaso”; primero identificar el contrato
  requerido.
- No cambiar permisos sólo en Angular: el backend conserva la autoridad.
- No usar borrados, restauraciones o comandos destructivos sin nombrar el
  objetivo exacto y pedir autorización.

La Biblia define el producto. La API, modelos y migraciones definen el contrato
ejecutable. El contexto compartido con una IA debe contener lo mínimo de ambos
para que su propuesta sea útil sin inventar el resto.
