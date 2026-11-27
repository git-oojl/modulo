# Documentación de Modulo

La [Biblia del Proyecto](../PROJECT_BIBLE.md) define el producto, alcance y prioridades. Estos documentos explican cómo construir, operar y evolucionar el repositorio sin convertir las decisiones temporales de interfaz en arquitectura permanente.

| Documento | Úsalo para |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Monorepo, capas y decisiones técnicas. |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md) | Django/DRF, modelos, servicios, permisos y migraciones. |
| [API_BACKEND.md](API_BACKEND.md) | Recursos REST, visibilidad y reglas de acceso actuales. |
| [POSTGRESQL.md](POSTGRESQL.md) | Operar e inspeccionar PostgreSQL local. |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Preparar, ejecutar y validar el proyecto. |
| [DATA_DEMO.md](DATA_DEMO.md) | Cargar y usar datos sintéticos. |
| [WORKING_WITH_AGENTS.md](WORKING_WITH_AGENTS.md) | Colaborar con agentes de código. |
| [INSTALACION_HERRAMIENTAS.md](INSTALACION_HERRAMIENTAS.md) | Instalar o diagnosticar uv, Volta y Docker. |

El contrato operativo que una IA debe leer antes de modificar el repositorio es
[`goofy.md`](../goofy.md). No es una carpeta ni una configuración especial: es
documentación versionada que describe el runtime, comandos canónicos y límites
de cambio del proyecto.

## Fuente de verdad

- La Biblia resuelve alcance y reglas de negocio.
- Las migraciones describen el esquema compartido.
- `pyproject.toml` + `uv.lock` y `package.json` + `package-lock.json` fijan dependencias.
- OpenAPI en `/api/v1/schema/` describe el contrato ejecutable.

No se versionan bases, volúmenes, `.env`, medios privados ni secretos. Para compartir un estado inicial se actualizan migraciones, `seed_demo` y documentación.
