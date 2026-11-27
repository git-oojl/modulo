# PostgreSQL local

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
