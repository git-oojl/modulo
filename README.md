# Modulo

**Modulo** es una plataforma web para la operación inmobiliaria: concentra contactos, inmuebles, citas, seguimientos y cierres mediante una API propia. El frontend es un cliente de esa API; PostgreSQL conserva la información central.

La [Biblia del proyecto](PROJECT_BIBLE.md) define el producto, las reglas de negocio, los permisos y el alcance. Este README es la guía de instalación y trabajo con el repositorio.

## Tecnologías y requisitos

| Componente | Tecnología | Gestión de versiones |
| --- | --- | --- |
| Frontend | Angular 21, TypeScript 5.9, npm | [Volta](https://volta.sh/) y `frontend/package.json` |
| Backend | Python 3.12, Django 5.2 LTS, Django REST Framework 3.18 | [uv](https://docs.astral.sh/uv/) y `backend/.python-version` |
| Base de datos | PostgreSQL 17 | [Docker](https://docs.docker.com/get-docker/) y Docker Compose |

También se necesita [Git](https://git-scm.com/). En Windows, el preparador instala Volta, uv y Docker Desktop si faltan; consulta la [guía de instalación de herramientas](docs/INSTALACION_HERRAMIENTAS.md) para macOS, Linux, actualizaciones, instalaciones coexistentes y conflictos de puertos. No es necesario instalar Python, Node.js, npm o PostgreSQL manualmente: uv y Volta gestionan los runtimes del proyecto y Compose ejecuta la base de datos.

Las versiones de runtime se declaran en `frontend/package.json` y `backend/.python-version`; las dependencias se reproducen con `frontend/package-lock.json` y `backend/uv.lock`. No las sustituyas por versiones globales.

## Clonar y preparar

```bash
git clone <URL_DEL_REPOSITORIO> modulo
cd modulo
```

### Windows: preparacion recomendada

En Windows, prepara un clon nuevo con el script del repositorio:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Elige `[1]` si ya tienes Volta, uv y Docker listos; elige `[2]` si falta alguna herramienta y quieres que el script la instale mediante WinGet. El script crea `backend/.env` si falta, instala los runtimes declarados, sincroniza los lockfiles, levanta PostgreSQL y aplica las migraciones. La opción `[3]` solo revisa el estado del equipo y del proyecto.

Puedes ejecutarlo de nuevo en cualquier clon: no sobrescribe `.env`, no modifica los lockfiles y aplica las migraciones pendientes. Docker Desktop debe estar iniciado antes de usar `[1]`. Consulta [la guía de herramientas](docs/INSTALACION_HERRAMIENTAS.md) para los detalles de cada opción, incluida la configuración inicial de Docker Desktop.

### Preparacion manual

Usa esta ruta en macOS, Linux o si prefieres ejecutar cada paso por separado.

#### 1. Configurar el entorno del backend

Copia las variables de desarrollo:

```bash
cp backend/.env.example backend/.env
```

En PowerShell utiliza `Copy-Item backend/.env.example backend/.env`.

`backend/.env` contiene valores exclusivamente locales y no se versiona. Los comandos Django de esta guía lo cargan con **`uv run --env-file .env`**. En otros entornos, proporciona esas variables mediante el mecanismo de configuración correspondiente.

#### 2. Levantar PostgreSQL

Desde la raíz del repositorio:

```bash
docker compose -f infra/compose.yaml up -d --wait
```

Compose inicia PostgreSQL 17 en `127.0.0.1:5432`, usando una base y credenciales **solo de desarrollo** que corresponden a `backend/.env.example`. Los datos se conservan en un volumen Docker, incluso al detener el contenedor. Si el puerto `5432` está ocupado, cambia el puerto publicado en `infra/compose.yaml` y `POSTGRES_PORT` en `backend/.env`.

#### 3. Instalar dependencias y migrar

Backend:

```bash
cd backend
uv python install
uv sync --frozen
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py check
cd ..
```

`uv python install` toma la versión de `.python-version`. `uv sync --frozen` prepara `.venv` con las versiones registradas en `uv.lock`.

Frontend:

```bash
cd frontend
npm ci
cd ..
```

**Ejecuta npm dentro de `frontend/`**: desde ese directorio, Volta aplica automáticamente las versiones fijadas en `package.json`. `npm ci` utiliza `package-lock.json` sin resolver versiones nuevas.

## Ejecutar en desarrollo

Abre dos terminales en el repositorio.

**API Django** (terminal 1):

```bash
cd backend
uv run --frozen --env-file .env python manage.py runserver
```

- Administración Django: `http://127.0.0.1:8000/admin/`
- Esquema OpenAPI: `http://127.0.0.1:8000/api/v1/schema/`
- Documentación interactiva: `http://127.0.0.1:8000/api/v1/docs/`

Para crear una cuenta de administración local:

```bash
uv run --frozen --env-file .env python manage.py createsuperuser
```

**Angular** (terminal 2):

```bash
cd frontend
npm start
```

El servidor web de desarrollo abre en `http://localhost:4200/`. `npm start` utiliza `frontend/proxy.conf.json`: las llamadas a rutas relativas `/api/v1/` se redirigen a Django en `127.0.0.1:8000`, sin URLs de API fijas en los componentes ni CORS abierto para desarrollo. Inicia ambos servidores para consumir la API desde Angular.

## Comandos habituales

Desde `backend/`:

```bash
uv sync --frozen
uv run --frozen --env-file .env python manage.py makemigrations
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py test
uv run --frozen --env-file .env python manage.py check
```

Desde `frontend/`:

```bash
npm ci
npm run build
npm test -- --watch=false
```

Desde la raíz:

```bash
docker compose -f infra/compose.yaml ps
docker compose -f infra/compose.yaml logs -f db
docker compose -f infra/compose.yaml down
```

`down` detiene y elimina los contenedores y la red, **sin borrar el volumen de datos**. No uses `down -v` salvo que quieras eliminar la base local.

## Organización y convenciones

```text
modulo/
├── PROJECT_BIBLE.md          Especificación funcional y técnica
├── README.md                 Preparación, comandos y convenciones
├── backend/                  Django, DRF, uv.lock y migraciones
│   ├── config/               Configuración y rutas
│   ├── accounts/              Usuarios y autenticación
│   ├── organizations/         Organización y fuentes
│   ├── contacts/              Contactos y seguimiento
│   ├── properties/            Inventario
│   ├── appointments/          Citas
│   ├── core/                  Utilidades compartidas
│   └── integrations/          Adaptadores externos
├── frontend/                 Angular y package-lock.json
├── infra/                    Docker Compose y despliegue
├── scripts/                  Herramientas para el equipo
└── docs/                     Material de apoyo
```

- Una migración Django es el mecanismo para compartir cambios de esquema: no se intercambian bases locales ni se versionan datos privados.
- Los cambios de dependencias Python actualizan `pyproject.toml` **y** `uv.lock`; los del frontend actualizan `package.json` **y** `package-lock.json`. Se versionan ambos archivos de cada pareja.
- Las reglas críticas, los permisos y la persistencia pertenecen al backend. Los componentes Angular no sustituyen validaciones de la API.
- La API está versionada bajo `/api/v1/` y documentada mediante OpenAPI. Por defecto requiere autenticación de sesión; cada endpoint público debe habilitarse explícitamente. Las funciones por dominio residen en sus aplicaciones Django; la infraestructura compartida permanece en `core/`.
- Configuración y credenciales se suministran por variables de entorno. No se publican archivos `.env`, claves, archivos multimedia privados ni volúmenes de PostgreSQL.

## Datos y operación

PostgreSQL es la fuente de verdad. El contenedor local utiliza un volumen persistente, **pero ese volumen no es un respaldo**. Para trabajar con datos reales se requieren credenciales propias, HTTPS, permisos efectivos, almacenamiento persistente de archivos y procedimientos de respaldo y restauración comprobados, según la Biblia.
