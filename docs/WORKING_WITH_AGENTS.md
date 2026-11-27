# Cómo encargar trabajo a una IA

El contrato que el agente debe leer primero está en [`../goofy.md`](../goofy.md).
Esta guía sirve a quien formula el encargo: reduce contexto perdido, evita que
la IA invente arquitectura y hace verificable la entrega.

## Qué compartir al comenzar

No hace falta pegar todo el repositorio. Comparte siempre:

1. `goofy.md` y la sección relevante de `PROJECT_BIBLE.md`.
2. El resultado observable que buscas y los archivos o dominio en alcance.
3. La superficie permitida: código, migraciones, pruebas, documentación,
   dependencias y commits.
4. Las exclusiones: por ejemplo, “no modificar frontend”, “no tocar datos
   existentes” o “solo diagnosticar”.

Para una pantalla Angular que consumirá la API, agrega el servicio Angular, el
contrato de `docs/API_BACKEND.md`, la view/serializer/URL relacionada y
`frontend/proxy.conf.json`. Indica: **usa los servicios existentes; no crees
otro cliente HTTP ni pongas permisos de negocio solo en la interfaz**.

Para una regla de dominio, agrega el modelo, servicio, permiso y pruebas más
cercanos. Indica si la IA puede crear migración. Una migración forma parte del
cambio de esquema: no es un detalle opcional.

## Forma útil de pedir cambios

Un encargo efectivo tiene cinco partes:

```text
Resultado: qué debe poder hacer el sistema al terminar.
Alcance: apps, archivos o capas que sí puede modificar.
Reglas: sección de la Biblia y restricciones de seguridad/visibilidad.
Entrega: migraciones, pruebas, docs y/o commits requeridos.
Límites: qué no debe tocar y si debe detenerse ante una decisión de producto.
```

Ejemplo de cambio de backend:

> Implementa la exportación CSV de citas para gerencia. Lee `goofy.md`, la
> Biblia y la API actual. Respeta la visibilidad por asesor, usa
> `integrations/`, añade pruebas y actualiza el contrato API. Puedes crear
> migraciones si son necesarias. No cambies frontend ni dependencias. Haz los
> commits en español.

Ejemplo de auditoría:

> Audita los permisos de asesores sobre contactos, citas y cierres. No
> implementes nada: entrega hallazgos con archivo/línea, casos de prueba
> ausentes y el riesgo. No infieras reglas fuera de la Biblia.

Ejemplo de integración de una vista:

> Conecta esta vista usando el servicio Angular y el endpoint ya documentado.
> No crees llamadas HTTP directas en el componente, no cambies el contrato del
> backend y reporta cualquier dato que la API aún no exponga.

## Expectativas de una entrega

Pide que la respuesta final diga, como mínimo:

- resultado y decisiones tomadas;
- archivos o áreas modificadas;
- comandos de validación ejecutados y su resultado;
- bloqueos o riesgos reales, sin presentarlos como resueltos;
- commits creados, si se autorizaron.

## Límites que conviene declarar expresamente

- No usar `git reset --hard`, `git checkout --`, `docker compose down -v`,
  restauraciones ni borrados sin una orden que nombre el objetivo exacto.
- No copiar secretos en chat, fixtures, documentación, commits ni ejemplos.
- No tratar estados de una pantalla todavía provisional como especificación del
  producto.
- No modificar tablas o índices con SQL manual: se usa Django y migraciones.
- No añadir dependencias por comodidad sin explicar por qué las existentes no
  bastan.

La Biblia define el producto; `goofy.md` define la operación reproducible. La
documentación técnica debe conservar contratos durables, no narrar flujos de
interfaz que aún pueden cambiar.
