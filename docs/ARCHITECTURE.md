# Arquitectura técnica

Modulo es un monolito modular: una API Django desplegable, PostgreSQL y un
cliente Angular independiente. No hay microservicios, bases por módulo ni
dependencia estructural de servicios externos.

## Límites entre capas

~~~text
Solicitud HTTP
   │
   ├── URLs: composición y versión pública
   ├── View / ViewSet: autenticación, alcance, filtros y respuesta HTTP
   ├── Serializer: forma del payload y validaciones locales
   ├── Service: transición de dominio que coordina varios modelos
   ├── Model + migración: persistencia, constraints e índices
   └── PostgreSQL: integridad y almacenamiento transaccional
~~~

Una capa no sustituye la responsabilidad de otra:

- Una ruta Angular no autoriza un recurso; la view filtra el queryset y valida
  la mutación.
- Un serializer no debe resolver una operación multi-registro en pasos
  independientes; esa lógica va a un servicio con transacción.
- Una restricción de PostgreSQL protege datos incluso si una vista nueva omite
  una validación, pero no reemplaza un mensaje de error útil ni permisos.
- Una migración describe el cambio reproducible de esquema; no se arregla una
  base manualmente con SQL.

## Recorrido de una operación de negocio

Tomemos un cierre como ejemplo de separación correcta:

1. La ruta dirige el POST a ClosingViewSet.
2. El permiso limita creación a gerencia/administración.
3. ClosingSerializer valida forma, importes y compatibilidad de operación.
4. register_closing bloquea la propiedad, comprueba su estado, crea cierre y
   comisión, retira publicación e inventario en una transacción.
5. Las restricciones de la base impiden dos cierres vigentes por propiedad.
6. La respuesta se serializa desde el estado resultante.

No debe existir una segunda implementación de esa transición en Angular, una
signal opaca que cambie la propiedad después de guardar, ni un PATCH especial
que salte el servicio.

## Código y dependencias entre apps

| App | Puede conocer | No debe poseer |
| --- | --- | --- |
| accounts | identidad, roles, perfil de asesor | contactos como sustituto de usuarios. |
| organizations | organización y catálogo de fuentes | reglas de venta o cierre. |
| contacts | CRM, intereses, actividades, seguimientos | ciclo de inventario. |
| properties | inventario y medios | datos privados del CRM en serializers públicos. |
| appointments | agenda y resultado de reunión | reglas de comisión. |
| closings | resultado económico y comisión estimada | reactivación implícita de inventario. |
| integrations | adaptación y exportación | identidad canónica de proveedores. |
| core | bases abstractas, permisos y resumen transversal | reglas de un dominio concreto. |

Es aceptable que un serializer o servicio use modelos de otro dominio cuando la
relación es real. No es aceptable crear importaciones circulares ni esconder
reglas de dominio en core solo por evitar decidir a quién pertenecen.

## Datos, archivos y configuración

PostgreSQL conserva entidades de negocio, relaciones, constraints e índices.
Los archivos de medios se guardan mediante el storage de Django y la base
conserva sus metadatos/referencias. Esto permite modificar el proveedor de
archivos sin alterar los modelos centrales.

La configuración vive en variables de entorno: backend/.env para desarrollo
local y el mecanismo seguro del despliegue para otros entornos. Los valores
versionados son plantillas, Compose, manifests y lockfiles; secretos, volúmenes,
medios y backups permanecen fuera de Git.

## Superficies de red

~~~text
Navegador Angular ── proxy de desarrollo ──┐
                                            ├── Django /api/v1/
Herramientas autorizadas ───────────────────┘        │
                                                     ├── PostgreSQL
Visitante público ─── catálogo/consulta pública ─────┤
                                                     └── storage de medios
~~~

El proxy Angular evita URLs absolutas del API en componentes durante
desarrollo. La API privada requiere sesión/CSRF; solo catálogo, consulta
pública, health y documentación se habilitan explícitamente para anónimos. El
storage de medios no debe convertirse accidentalmente en una carpeta pública
sin política de acceso.

## Trabajo asíncrono y escalamiento

Celery está declarado como dependencia, pero no hay cola, broker ni tarea de
negocio configurada actualmente. No documentes ni implementes procesos
asíncronos como si existieran. Cuando una función requiera correo, importación
masiva, sincronización externa o procesamiento de archivos, primero se debe
decidir su broker, idempotencia, observabilidad, reintentos, límites y
propiedad de datos.

Mientras el sistema sea síncrono, las operaciones de request deben ser
acotadas: no hacer llamadas externas lentas dentro de transacciones ni generar
exportaciones masivas sin paginación/streaming y límites definidos.

## Mapa para navegar el repositorio

| Pregunta | Primer lugar que revisar |
| --- | --- |
| Regla funcional | PROJECT_BIBLE.md, luego servicio/modelo del dominio. |
| Ruta HTTP y permiso | config/urls.py, urls de app, view y core/permissions.py. |
| Campos de entrada/salida | Serializer y OpenAPI. |
| Cambio de esquema | Modelo, migraciones de la app y constraints. |
| Datos iniciales | core/management/commands/seed_demo.py. |
| Configuración local | backend/.env.example, infra/compose.yaml, scripts/setup.ps1. |
| Cliente de la API | Servicios Angular y frontend/proxy.conf.json. |

## Consecuencias al cambiar arquitectura

Un cambio de patrón requiere más que mover archivos. Por ejemplo, extraer un
servicio implica contrato de red, autenticación entre servicios, transacciones
distribuidas o compensación, observabilidad, despliegue, propiedad de base y
migración de datos. Con el tamaño y necesidades actuales, mantener el monolito
modular ofrece una operación y un modelo consistente más sencillos.

## Topología de despliegue

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
