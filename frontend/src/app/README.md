# Estructura del frontend

Esta estructura sigue `PROJECT_BIBLE.md` y separa el sistema interno cerrado del catálogo público opcional.

- `core/`: sesión, guardas, configuración de módulos, modelos transversales y cliente API.
- `layout/`: shells de navegación; `app-shell` es exclusivo del personal y `public-shell` no comparte navegación interna.
- `shared/`: componentes visuales reutilizables sin reglas de dominio.
- `features/<dominio>/`: cada dominio contiene `pages/`, `data-access/`, `models/` y `<dominio>.routes.ts` cuando aplica.

## Rutas

Las rutas internas canónicas viven bajo `/app/`. Las listas, altas, detalles y ediciones requeridos por la Biblia ya tienen una página y ruta reservadas. Las páginas que aún no se desarrollan muestran un marcador explícito; no representan una implementación funcional.

El catálogo de propiedades está aislado en `features/catalog/` y se mantiene apagado mediante `core/config/app-features.config.ts`. Activarlo no concede acceso al sistema de empleados.

## Convenciones para nuevas funciones

1. Añade contratos a `models/` y solicitudes HTTP a `data-access/`; las páginas no hacen llamadas HTTP directas.
2. Conserva los textos y decisiones críticas en el backend; las guardas del cliente solo orientan la navegación.
3. Para una nueva pantalla, crea su carpeta en `pages/`, añade su ruta al archivo de rutas del dominio y aplica la guarda/rol que corresponda.
4. No conviertas los datos de demostración existentes en una fuente de verdad: sustitúyelos por servicios tipados al conectar la API.
