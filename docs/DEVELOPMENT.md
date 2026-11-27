# Desarrollo diario

Esta guía describe el ciclo reproducible para modificar el repositorio. La
Biblia define producto y alcance; esta guía define cómo preparar, validar y
entregar código sin mezclar estado local con el proyecto versionado.

## Antes de empezar

Comprueba que estás en la rama esperada y revisa cambios heredados:

~~~powershell
git status --short
git branch --show-current
git log -5 --oneline
~~~

No descartes cambios ajenos para dejar el árbol limpio. Identifica si se
solapan con tu tarea y conserva lo que no te pertenece. La preparación local
debe usar los lockfiles del checkout actual; cambiar de rama puede requerir
volver a sincronizar uv, npm y migraciones.

## Flujo normal de trabajo

~~~text
actualizar checkout
        │
        ▼
preparar runtimes y dependencias
        │
        ▼
arrancar PostgreSQL y migrar
        │
        ▼
desarrollar en una rama
        │
        ▼
validar backend + frontend
        │
        ▼
revisar diff, documentar y commitear
~~~

Para el entorno ya instalado, el preparador de Windows es el punto de entrada:

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
~~~

El menú permite preparar dependencias, comprobar estado, iniciar la base,
aplicar migraciones o cargar la semilla. La opción de semilla presupone que
backend/.env y el entorno uv ya existen; no instala dependencias de forma
implícita.

## Estado local que no se versiona

| Ruta o recurso | Por qué es local |
| --- | --- |
| backend/.env | Secretos y configuración de esta máquina. |
| backend/.venv | Entorno recreable desde uv.lock. |
| frontend/node_modules | Dependencias recreables desde package-lock.json. |
| backend/media | Cargas y cubiertas generadas durante desarrollo. |
| Volumen postgres_data | Base mutable de Docker. |
| Dumps de PostgreSQL | Pueden contener información sensible. |
| build outputs/caches | Productos recreables de Angular y herramientas. |

Lo que sí viaja por Git es código, migraciones, tests, documentación, Compose,
manifests y lockfiles. Para que un clon nuevo tenga datos de ejemplo, se mejora
seed_demo, no se adjunta una base de datos.

## Cambio de modelo o dependencia

### Modelo Django

1. Ajusta modelo, servicio, serializer, permisos y pruebas necesarias.
2. Genera migración y léela antes de aplicarla.
3. Ejecuta migración sobre PostgreSQL local.
4. Ejecuta check y suite de pruebas.
5. Actualiza DATA_MODEL.md y API_BACKEND.md si afecta un contrato estable.

~~~powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py test
~~~

### Dependencia Python

Modifica pyproject.toml de manera intencional, sincroniza con uv y conserva el
lockfile resultante. No uses pip dentro de .venv.

~~~powershell
cd backend
uv add <paquete>
uv sync --frozen
~~~

### Dependencia frontend

Ejecuta npm desde frontend para que Volta tome las versiones del proyecto.
Revisa package.json y package-lock.json como una pareja. Una dependencia nueva
debe justificar tamaño, mantenimiento, licencia, compatibilidad Angular y
motivo por el que las piezas actuales no bastan.

~~~powershell
cd frontend
npm install <paquete>
npm run build
~~~

## Validación proporcional

Un cambio pequeño de documentación no necesita levantar la aplicación completa,
pero sí revisión de enlaces y formato. Un cambio de backend, contrato o
migración debe validar backend. Un cambio de Angular debe pasar formato, lint y
build. Un cambio transversal debe ejecutar ambos grupos:

~~~powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test

cd ..\frontend
npm run format:check
npm run lint
npm run build
~~~

El build puede reportar presupuestos de bundle que existían antes de tu cambio.
No lo presentes como éxito ni lo ocultes: informa el comando, resultado y si
el fallo es previo o introducido. Del mismo modo, no afirmes validar Docker si
el motor no estaba disponible.

## Recuperación de un checkout

Si las dependencias parecen desalineadas después de una rama o un cambio de
lockfile, no borres archivos arbitrariamente. Haz primero:

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
# elegir [3] para diagnóstico o [1] para preparación
~~~

Si una migración no se aplica, revisa estado de Git, backend/.env,
docker compose ps y el plan de migración. Si se necesita volver a crear una
base estrictamente local, primero genera/valida backup y nombra el volumen que
se va a eliminar. Consulta POSTGRESQL.md antes de un down -v.

## Cierre de una tarea

Antes de commit:

1. Revisa git diff y git diff --check.
2. Comprueba que modelos incluyan migración y cambios de API incluyan tests/docs.
3. Verifica que ningún .env, dump, secreto, media privada o cambio ajeno vaya
   al stage.
4. Describe validaciones reales y bloqueos restantes.
5. Usa mensaje de commit breve en español.

No hay una regla automática de que todo cambio deba tener un commit propio,
pero los commits deben conservar una unidad revisable. Un commit que mezcla
reformateo masivo, cambio de reglas, dependencias y archivos generados es
difícil de revisar y revertir.

## Preparación

En Windows, la ruta principal es:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

El script prepara `.env` si falta, sincroniza uv y npm, levanta PostgreSQL y aplica migraciones. Consulta [INSTALACION_HERRAMIENTAS.md](INSTALACION_HERRAMIENTAS.md) si falta una herramienta.

Para una base local recién creada, la opción `[6]` del mismo menú aplica
migraciones y ejecuta `seed_demo`. Solo úsala con datos sintéticos; el comando
es idempotente, pero no está pensado para una base real.

## Servidores locales

En dos terminales:

```powershell
cd backend
uv run --frozen --env-file .env python manage.py runserver
```

```powershell
cd frontend
npm run dev
```

Angular usa el proxy local para `/api/v1/`; no escribas URLs absolutas del backend en componentes.

## Antes de entregar

```powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py check
uv run --frozen --env-file .env python manage.py test
```

```powershell
cd frontend
npm run format:check
npm run lint
npm run build
```

Revisa `git status`; incluye migraciones con modelos, ambos lockfiles con dependencias y usa commits concisos en español.
