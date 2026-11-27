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
| [DATA_MODEL.md](DATA_MODEL.md) | Entidades, relaciones, invariantes y retención. |
| [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) | Decisiones técnicas ya tomadas y sus consecuencias. |
| [EXTERNAL_INTEGRATIONS.md](EXTERNAL_INTEGRATIONS.md) | Límites de exportaciones, archivos y futuros proveedores. |
| [AGENT_OPERATING_GUIDE.md](AGENT_OPERATING_GUIDE.md) | Runtime, comandos y contrato para agentes de código. |
| [WORKING_WITH_AGENTS.md](WORKING_WITH_AGENTS.md) | Colaborar con agentes de código. |
| [INSTALACION_HERRAMIENTAS.md](INSTALACION_HERRAMIENTAS.md) | Instalar o diagnosticar uv, Volta y Docker. |
| [../frontend/README.md](../frontend/README.md) | Cliente Angular, sesión, proxy y contrato de integración. |
| [../backend/README.md](../backend/README.md) | Inicio rápido y mapa del backend Django. |

Una IA debe leer primero la
[`Guía operativa para agentes`](AGENT_OPERATING_GUIDE.md). Es documentación
versionada que describe el runtime, comandos canónicos y límites de cambio del
proyecto.

## Fuente de verdad

- La Biblia resuelve alcance y reglas de negocio.
- Las migraciones describen el esquema compartido.
- `pyproject.toml` + `uv.lock` y `package.json` + `package-lock.json` fijan dependencias.
- OpenAPI en `/api/v1/schema/` describe el contrato ejecutable.

No se versionan bases, volúmenes, `.env`, medios privados ni secretos. Para compartir un estado inicial se actualizan migraciones, `seed_demo` y documentación.
