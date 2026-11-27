# Frontend de Módulo

El frontend es un cliente Angular 21 independiente que consume la API Django
de Módulo. Usa Angular Material, Transloco, PWA y Capacitor; su idioma inicial
es español. La Biblia y el backend son autoridades de reglas de negocio: este
cliente presenta y solicita datos, no sustituye permisos, validaciones ni
transiciones del servidor.

## Contrato de runtime

Node 22.23.3 y npm 10.9.9 están fijados en package.json mediante Volta.
package-lock.json es el lockfile que reproduce dependencias. Ejecuta npm desde
esta carpeta para que Volta seleccione esas versiones; no uses un npm global ni
cambies el lockfile de forma accidental.

~~~powershell
cd frontend
npm ci
npm start
~~~

Para un clon nuevo completo, la entrada recomendada sigue siendo el preparador
desde la raíz del repositorio:

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
~~~

## Estructura

~~~text
src/app/
├── core/             servicios transversales: HTTP, sesión, guards, flags
├── features/         módulos de dominio y sus data-access/models/pages
├── layout/           shells y navegación compartida
├── shared/           componentes UI y utilidades reutilizables
├── app.config.ts     providers de Angular, HTTP/XSRF y routing
└── app.routes.ts     composición de rutas, no reglas de autorización final
~~~

Cada feature debe concentrar tipos, adaptadores y data-access cerca del dominio
que consume. Un componente de página debe coordinar estado y presentación; no
debe repetir URLs, serialización, headers ni reglas de permisos.

## Cliente HTTP y proxy

ApiClientService es la base para servicios de datos. Su raíz es /api/v1, una
ruta relativa que Angular desvía durante desarrollo a Django mediante
proxy.conf.json:

~~~text
Navegador ── http://localhost:4200/api/v1/... ── proxy Angular ── Django 127.0.0.1:8000
~~~

Esto evita codificar host, puerto o CORS en componentes. Para un recurso nuevo:

1. consulta primero docs/API_BACKEND.md y OpenAPI;
2. crea/actualiza el servicio de data-access del feature;
3. modela request/response tipados, incluidos campos opcionales;
4. deja que el componente llame al servicio, no a HttpClient directamente;
5. trata errores de autorización/validación de forma visible para el usuario;
6. actualiza pruebas y documentación si el contrato cambia.

No añadas una segunda base URL, fetch ad hoc o cliente HTTP paralelo. Si la API
no tiene la capacidad necesaria, el cambio debe empezar en backend.

## Sesión, CSRF y autorización

AuthService obtiene CSRF antes de login, usa la sesión Django y consulta el
usuario actual. Angular se configura con cookie csrftoken y header X-CSRFToken.
La cookie de sesión es HttpOnly: no se lee ni se guarda manualmente desde
TypeScript.

Guards y navegación mejoran experiencia, pero no conceden acceso. Ante un 401
o 403, el cliente debe dejar de asumir que el recurso está disponible y el
backend conserva la decisión definitiva. Nunca guardes contraseñas, tokens o
campos privados del CRM en localStorage.

## Modelos de frontend y contrato de backend

Los modelos TypeScript representan el contrato que consume la interfaz, no una
copia de entidades Django. Pueden omitir detalles internos, pero no deben
inventar estados ni cambiar nombres de enum para comodidad visual sin un
adaptador claro.

Mantén separados:

| Capa | Responsabilidad |
| --- | --- |
| Modelo API | Forma de JSON recibida/enviada al backend. |
| Servicio data-access | URL, parámetros, mapeo mínimo y errores HTTP. |
| Estado/componente | Carga, selección, formularios y presentación. |
| UI compartida | Elementos sin conocimiento del dominio ni de HTTP. |

El catálogo público usa campos distintos de inventario privado. No reutilices
un modelo interno que incluya dirección precisa, notas, asignaciones u otra
información que el serializer público excluye.

## Formularios y mutaciones

La interfaz puede validar formatos y requeridos para dar retroalimentación
rápida, pero debe mostrar también errores de servidor. Una mutación sólo se
considera aceptada después de respuesta exitosa del backend. No actualices
permanentemente una lista local antes de resolver qué hacer ante error,
conflicto de permiso o transición rechazada.

Acciones de dominio como completar una cita o anular un cierre usan sus
endpoints específicos. No las simules con PATCHes genéricos ni cambies un
estado visual que contradiga API_BACKEND.md.

## Internacionalización, PWA y Capacitor

Transloco concentra textos traducibles. Evita esparcir cadenas de interfaz
difíciles de localizar en servicios o modelos. La PWA mejora disponibilidad de
activos; no autoriza guardar una copia offline de CRM, contactos, cierres o
medios privados sin política explícita de seguridad y sincronización.

Capacitor es un borde de plataforma, no una razón para acoplar componentes a
Android. Una función nativa nueva debe degradarse correctamente en navegador y
mantener las mismas restricciones de identidad, sesión y privacidad.

## Validación y formato

~~~powershell
cd frontend
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
~~~

Usa npm run format para aplicar Prettier. Antes de aceptar un cambio, informa
qué comandos se ejecutaron y los resultados reales. Un presupuesto de bundle
que falle debe revisarse o declararse como bloqueo; no se silencia cambiando
límites sin una decisión consciente.

## Cómo dar contexto a una IA

Comparte AGENT_OPERATING_GUIDE.md, esta guía, la vista o feature exacta, su
servicio data-access, los tipos que usa y el fragmento aplicable de
API_BACKEND.md. Indica explícitamente si puede cambiar backend, contrato, tests
o dependencias. La instrucción base es: usa el cliente y servicios existentes;
no agregues HTTP directo al componente ni conviertas una maqueta en regla de
negocio.
