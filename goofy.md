# Contrato operativo para agentes de Modulo

Este repositorio está pensado para que una persona o un agente de código pueda
trabajar de forma segura en Windows. Antes de cambiar comportamiento de
producto, lee `PROJECT_BIBLE.md`: es la autoridad sobre alcance, reglas y
prioridades. Este archivo define cómo operar el repositorio; no redefine la
Biblia ni documenta pantallas provisionales.

## Estructura del repositorio

- `backend/`: API Django + Django REST Framework, administrada con `uv`.
- `frontend/`: cliente Angular, administrado con npm mediante Volta.
- `infra/`: PostgreSQL local con Docker Compose.
- `docs/`: documentación de arquitectura, operación y contratos.
- `scripts/`: preparación reproducible del entorno Windows.
- `PROJECT_BIBLE.md`: especificación del producto y límites de negocio.

## Contrato de runtime

- Sistema operativo de desarrollo principal: Windows 10/11 con PowerShell 5.1
  o PowerShell 7. Los scripts no deben depender de un perfil interactivo.
- Backend: CPython 3.12, declarado en `backend/.python-version`, Django 5.2
  LTS y DRF. `backend/uv.lock` es el lockfile canónico.
- Frontend: Node 22.23.3 y npm 10.9.9 declarados en `frontend/package.json`.
  `frontend/package-lock.json` es el lockfile canónico.
- Datos normales de desarrollo: PostgreSQL 17 en Docker, accesible solo por
  `127.0.0.1:5432`.
- SQLite se permite únicamente como arnés aislado para pruebas; no cambia que
  PostgreSQL es la base que debe soportar la aplicación.

No uses `pip`, Python global, npm global ni instalaciones de PostgreSQL locales
para sustituir estas herramientas. Ejecuta Python con `uv run` y npm desde
`frontend/`, donde Volta aplica sus versiones fijadas.

## Primeros comandos

Un clon nuevo se prepara preferentemente así:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

El menú ofrece:

```text
[1] Preparar entorno de Modulo
[2] Instalación completa: herramientas + entorno de Modulo
[3] Comprobar dependencias instaladas
[4] Iniciar solo Docker y PostgreSQL
[5] Aplicar solo migraciones Django
[6] Migrar y cargar datos demo sintéticos
```

Después, para validar un cambio corriente:

```powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test

cd ..\frontend
npm run format:check
npm run lint
npm run build
```

No ejecutes `python manage.py ...` sin `uv run`, ni sustituyas `npm ci` por
`npm install` cuando se busca una instalación reproducible. Si una validación
no puede ejecutarse, informa el bloqueo exacto y no supongas que pasó.

## Configuración y datos demo

`backend/.env` es local y se crea desde `backend/.env.example`; no se versiona.
La configuración local de Docker debe coincidir con ese archivo. Arranca la
base con:

```powershell
docker compose -f infra/compose.yaml up -d --wait
```

La semilla se ejecuta solo sobre datos locales sintéticos:

```powershell
cd backend
uv run --frozen --env-file .env python manage.py seed_demo
```

Incluye cuentas demo y datos inmobiliarios de Baja California. Las cuentas usan
la contraseña documentada en `backend/README.md`. Nunca ejecutes la semilla en
una base con datos reales y nunca publiques contraseñas, dumps o archivos
`.env`.

## Disciplina de cambios

- Para cambiar modelos, crea migraciones; no alteres tablas, índices ni datos
  de esquema directamente con SQL.
- Conserva juntos `pyproject.toml` + `uv.lock` y `package.json` +
  `package-lock.json` cuando una dependencia cambia intencionalmente.
- Las reglas críticas, las restricciones de acceso y las transacciones viven
  en Django. La visibilidad en Angular no es autorización.
- Usa servicios de dominio para operaciones que afectan varios registros;
  aplica transacciones y pruebas de los casos límite.
- No conviertas una maqueta, nombre de ruta o estado visual temporal en una
  regla de negocio sin verificarlo en la Biblia.
- No introduzcas proveedores externos en entidades de dominio: los adaptadores
  pertenecen a `backend/integrations/` y los UUID internos siguen siendo la
  identidad propia.
- No cometas secretos, `.env`, volúmenes, dumps, medios privados ni datos de
  clientes. `docker compose down -v`, restauraciones y borrados requieren un
  objetivo explícito porque destruyen datos locales.
- Antes de declarar completo un cambio, enumera archivos relevantes,
  validaciones ejecutadas y bloqueos restantes. Los commits del proyecto se
  escriben en español.

## Paquete mínimo para una IA

Cuando otra IA no pueda inspeccionar todo el repositorio, compártele:

1. `goofy.md` y `PROJECT_BIBLE.md`.
2. La vista, modelo o archivo exacto que se desea cambiar.
3. `docs/ARCHITECTURE.md`, `docs/BACKEND_GUIDE.md` y, si aplica,
   `docs/API_BACKEND.md`.
4. Para integración Angular/API, el servicio Angular correspondiente, el
   serializer/view/URL del backend y `frontend/proxy.conf.json`.
5. La restricción explícita de superficie: por ejemplo, “no añadas
   dependencias”, “incluye migración y pruebas” o “solo audita, no modifiques”.

Dile de forma inequívoca: **usa contratos y servicios existentes; no crees
otro cliente HTTP, otra fuente de verdad ni reglas de permisos en la UI**.

Consulta `docs/WORKING_WITH_AGENTS.md` para ejemplos de encargos y
`docs/POSTGRESQL.md` para inspeccionar la base sin modificar su esquema.
