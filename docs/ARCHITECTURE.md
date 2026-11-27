# Arquitectura técnica

Modulo es un monolito modular: una API Django desplegable, PostgreSQL y un cliente Angular independiente. No hay microservicios, bases por módulo ni dependencia estructural de servicios externos.

```text
Angular / PWA / futuros clientes
             │ HTTPS + sesión + CSRF
             ▼
        Django + DRF · /api/v1/
        ├── servicios de dominio
        ├── permisos y validación
        └── OpenAPI
             │
             ▼
        PostgreSQL ── almacenamiento de archivos
```

## Repositorio

```text
modulo/
├── PROJECT_BIBLE.md       especificación principal
├── backend/               Django, DRF, migraciones y uv
├── frontend/              Angular, PWA y npm
├── infra/                 Compose para PostgreSQL local
├── scripts/               preparación de Windows
└── docs/                  decisiones y operación técnica
```

## Principios de implementación

1. PostgreSQL guarda los registros centrales; Angular no es fuente de verdad.
2. Los componentes consumen servicios HTTP tipados. Las reglas críticas viven en Django.
3. Las operaciones multi-registro se concentran en servicios de dominio y usan transacciones.
4. Las integraciones pertenecen a `integrations/`; ningún proveedor posee el CRM ni reemplaza un UUID interno.
5. Los historiales se conservan mediante actividades, seguimientos, archivado o anulación antes que borrado.
6. La marca vive en `Organization`; no se codifica en reglas de dominio.

## Seguridad y límites

La API privada usa sesión Django, cookies HttpOnly y CSRF. Los permisos se aplican en querysets y acciones del backend: ocultar una opción de Angular nunca concede acceso. El catálogo público usa serializers independientes y no revela dirección exacta, responsable, notas, historial o metadatos administrativos.

Las decisiones deliberadas incluyen un solo `Contact` para toda su evolución comercial, un `Property` como inventario maestro, cierres transaccionales que retiran una propiedad del catálogo y PWA sin una copia offline del CRM. SQLite existe solo como arnés aislado de pruebas; PostgreSQL es el entorno normal.
