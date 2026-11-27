# PostgreSQL local

## Modelo de operación local

Docker Compose ejecuta solamente PostgreSQL. Django y Angular siguen en el
host, por lo que el puerto se publica en loopback y la configuración de
backend/.env debe coincidir con infra/compose.yaml. Los valores incluidos son
exclusivamente de desarrollo local; no son una receta de credenciales para un
servidor compartido.

~~~text
backend/.env ──────┐
                    ├── host 127.0.0.1 : puerto publicado ── Docker db
infra/compose.yaml ─┘                                      └─ volumen postgres_data
~~~

Antes de diagnosticar Django, comprueba la cadena completa:

~~~powershell
docker compose -f infra/compose.yaml ps
docker compose -f infra/compose.yaml exec -T db pg_isready -U modulo -d modulo
cd backend
uv run --frozen --env-file .env python manage.py dbshell
~~~

El último comando abre psql usando exactamente las variables que Django usa.
No copies una contraseña de otro proyecto ni cambies el motor a SQLite para
evitar corregir un problema de conexión.

## Sesiones psql útiles

Puedes usar dbshell o ejecutar psql dentro del contenedor. Para una consulta
repetible desde PowerShell, el segundo evita depender de un cliente PostgreSQL
instalado en Windows:

~~~powershell
docker compose -f infra/compose.yaml exec -T db psql -U modulo -d modulo -c "SELECT current_database(), current_user;"
docker compose -f infra/compose.yaml exec -T db psql -U modulo -d modulo -c "SELECT app, name FROM django_migrations ORDER BY applied DESC LIMIT 20;"
~~~

Dentro de psql:

~~~sql
\conninfo
\l
\dt
\d properties_property
\d closings_closing
\dn
\q
~~~

Consultas seguras de inspección:

~~~sql
SELECT status, COUNT(*)
FROM properties_property
GROUP BY status
ORDER BY status;

SELECT status, COUNT(*), COALESCE(SUM(amount), 0)
FROM closings_closing
GROUP BY status
ORDER BY status;
~~~

Usa transacciones explícitas para experimentar con SQL local que no deba
persistir:

~~~sql
BEGIN;
-- consulta o prueba local limitada
ROLLBACK;
~~~

No crees tablas, columnas, índices o constraints manualmente. Tampoco cambies
campos operativos por SQL para saltar servicios de dominio: una base puede
quedar coherente a nivel de columna e incoherente a nivel de negocio.

## Migraciones y estado de esquema

Django mantiene qué migraciones se aplicaron en django_migrations. El ciclo
correcto de una modificación de modelo es:

~~~powershell
cd backend
uv run --frozen --env-file .env python manage.py makemigrations
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py makemigrations --check --dry-run
uv run --frozen --env-file .env python manage.py migrate --plan
~~~

Un fallo de migración no se resuelve eliminando filas de django_migrations ni
editando un archivo de migración que ya fue compartido. Revisa la dependencia,
la diferencia de ramas y, si el cambio se publicó, crea la migración correctiva
correspondiente.

## Respaldos y restauración local

Un volumen de Docker persiste entre reinicios, pero no es un backup. Para
obtener un dump consistente en formato custom:

~~~powershell
$backupPath = Join-Path $PWD "modulo-local-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
docker compose -f infra/compose.yaml exec -T db pg_dump -U modulo -d modulo -Fc > $backupPath
Get-Item $backupPath
~~~

Inspecciona el contenido antes de restaurar:

~~~powershell
docker compose -f infra/compose.yaml exec -T db pg_restore -l < .\modulo-local-YYYYMMDD-HHMMSS.dump
~~~

Para practicar una restauración, crea una base temporal dentro del mismo
contenedor y restaura allí. No sobrescribas modulo para validar que un backup
funciona:

~~~powershell
docker compose -f infra/compose.yaml exec -T db createdb -U modulo modulo_restore_check
docker compose -f infra/compose.yaml exec -T db pg_restore -U modulo -d modulo_restore_check < .\modulo-local-YYYYMMDD-HHMMSS.dump
docker compose -f infra/compose.yaml exec -T db psql -U modulo -d modulo_restore_check -c "SELECT COUNT(*) FROM django_migrations;"
docker compose -f infra/compose.yaml exec -T db dropdb -U modulo modulo_restore_check
~~~

Esos comandos crean y eliminan solo la base temporal nombrada. Para una
restauración real, define de antemano respaldo origen, destino exacto,
ventana de mantenimiento, responsables, verificación posterior y plan de
reversión. Nunca uses el seed como mecanismo de restauración.

## Problemas frecuentes

| Síntoma | Comprobación | Corrección segura |
| --- | --- | --- |
| Puerto 5432 ocupado | docker compose no puede publicar el puerto. | Identifica el proceso; no lo detengas si no es de Módulo. Cambia juntos Compose y POSTGRES_PORT si corresponde. |
| Contenedor no saludable | logs de db y pg_isready. | Espera el healthcheck; revisa Docker Desktop/WSL y el volumen antes de borrar nada. |
| Django no conecta | backend/.env, ps y dbshell. | Comprueba host, puerto, usuario, DB y que uv cargue el env file. |
| Migraciones distintas | showmigrations y estado Git. | Sincroniza código/migraciones; no manipules django_migrations. |
| Datos inesperados | consulta tablas y fecha de backup. | Restaura primero en base temporal y decide con evidencia. |

El equivalente de destruir una base local es docker compose down -v. Requiere
que el objetivo sea explícito: elimina el volumen de PostgreSQL de este
proyecto y no puede deshacerse sin un backup.

## Preparación para producción

Compose local no es un plan de producción. Antes de datos reales se necesita,
como mínimo: instancia con almacenamiento durable, cifrado en tránsito, acceso
de red restringido, usuario con privilegios mínimos, secretos fuera del repo,
backups automatizados, retención, restauración ensayada, monitoreo de espacio y
conexiones, y una estrategia de actualización PostgreSQL. Documenta esos
valores fuera del repositorio público; esta guía no contiene credenciales de
producción.

Modulo ejecuta PostgreSQL 17 en Docker. Django y Angular corren en el host; solo la base vive en Compose. La configuración está en [`infra/compose.yaml`](../infra/compose.yaml) y debe coincidir con `backend/.env`.

## Ciclo diario

```powershell
docker compose -f infra/compose.yaml up -d --wait
docker compose -f infra/compose.yaml ps
docker compose -f infra/compose.yaml logs -f db
docker compose -f infra/compose.yaml down
```

`down` conserva el volumen. `down -v` destruye deliberadamente la base local y no debe usarse por accidente.

## Hablar con PostgreSQL

```powershell
docker compose -f infra/compose.yaml exec db psql -U modulo -d modulo
```

Dentro de `psql`:

```sql
\conninfo
\dt
\d contacts_contact
SELECT COUNT(*) FROM properties_property;
SELECT status, COUNT(*) FROM properties_property GROUP BY status ORDER BY status;
\q
```

Para una sola consulta:

```powershell
docker compose -f infra/compose.yaml exec -T db psql -U modulo -d modulo -c "SELECT now();"
```

Usa SQL para inspección. Los cambios de esquema pertenecen a migraciones Django; no crees tablas, columnas o índices manualmente.

## Puerto y respaldo

Compose publica `127.0.0.1:5432`. Si está ocupado, cambia a la vez el puerto publicado de Compose y `POSTGRES_PORT` en `.env`. No detengas un contenedor ajeno.

Guarda respaldos fuera del repositorio:

```powershell
docker compose -f infra/compose.yaml exec -T db pg_dump -U modulo -d modulo -Fc > modulo-local.dump
```

Un respaldo puede contener datos sensibles. No lo subas a Git, no lo adjuntes a tickets públicos y no lo conviertas en la semilla compartida.

Para restaurar un respaldo en una base local que has decidido reemplazar,
detén los procesos que la usen y usa una base de destino explícita. `pg_restore`
puede borrar o sobrescribir objetos; verifica primero el archivo y el destino.
No es una operación de rutina ni un reemplazo de migraciones.
