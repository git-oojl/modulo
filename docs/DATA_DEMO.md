# Datos demo

La semilla existe para que un clon local sea demostrable y para que pruebas
manuales puedan atravesar estados y relaciones realistas. No representa datos
reales, no contiene fotografías comerciales y no sustituye respaldo,
anonimización ni migración de datos.

## Contrato de la semilla

El comando se ubica en core/management/commands/seed_demo.py y es idempotente:
reconoce el conjunto demo, lo crea si falta y actualiza sus registros
conocidos. No debe borrar ni modificar registros ajenos al conjunto sintético.

Los datos están centrados en Tijuana, Mexicali y la costa de Baja California.
Incluyen una organización, fuentes, administración, gerencia, asesores,
contactos en distintos estados, historial CRM, inmuebles con todo el ciclo de
inventario, citas con resultados variados, intereses, seguimientos y cierres
vigente/anulado. Así se puede comprobar listas, filtros, permisos, reglas de
publicación y estados excepcionales sin inventar fixtures en componentes.

## Requisitos y ejecución

Primero debe existir el entorno backend, backend/.env y una base PostgreSQL con
migraciones:

~~~powershell
docker compose -f infra/compose.yaml up -d --wait
cd backend
uv sync --frozen
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py seed_demo
~~~

El preparador ofrece el mismo resultado con la opción [6] cuando el entorno ya
está sincronizado. La opción migra y carga datos, pero no elige por ti si una
base contiene información que deba conservarse.

## Cuentas y seguridad

Las credenciales se documentan en backend/README.md exclusivamente para esta
base sintética local. Todas usan la misma contraseña intencionalmente porque
permiten recorrer roles durante desarrollo. Jamás copies esas cuentas a una
instalación pública, no las reutilices fuera de local y no transformes esta
tabla en un mecanismo de onboarding.

## Uso responsable

- Ejecuta seed_demo en una base local destinada a desarrollo o demostración.
- No la ejecutes contra producción, staging con datos de personas o una base
  compartida sin confirmar que acepta este conjunto de prueba.
- No edites la base demo directamente para “arreglar” la semilla; corrige el
  comando para que un entorno nuevo reproduzca el comportamiento.
- Si añades una entidad o un estado que requiere demostración, amplía la
  semilla de forma idempotente y añade una prueba adecuada.
- Si cambia un usuario, propiedad o estado nombrado en documentación, actualiza
  esta guía y backend/README.md en el mismo cambio.

`seed_demo` crea un entorno sintético para desarrollo local. No contiene clientes reales y no sustituye una política de respaldo.

En Windows, el camino más corto desde el preparador es elegir `[6] Migrar y
cargar datos demo sintéticos`; inicia PostgreSQL si hace falta, aplica las
migraciones y ejecuta la semilla. La opción no instala ni actualiza
dependencias.

```powershell
cd backend
uv run --frozen --env-file .env python manage.py migrate
uv run --frozen --env-file .env python manage.py seed_demo
```

La semilla es idempotente: al ejecutarla otra vez actualiza el conjunto demo conocido. No la ejecutes sobre una base real.

Incluye organización demo de Baja California, administración, gerencia y cuatro asesores; doce propiedades sintéticas (seis en Tijuana, cinco en Mexicali y una en Playas de Rosarito); contactos en todos los estados; actividades, intereses, seguimientos; citas en todos sus resultados; y una venta vigente junto con una renta anulada.

Todas las cuentas usan `DemoPassword123!`. Consulta [backend/README.md](../backend/README.md) para usuarios. Las cubiertas se generan en `backend/media/` y son SVG sintéticos, no fotografías comerciales.
