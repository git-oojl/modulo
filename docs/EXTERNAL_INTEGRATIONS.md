# Integraciones y fronteras externas

Módulo mantiene el CRM, inventario, agenda y cierres como datos propios. Una
integración puede transportar, presentar o enriquecer datos, pero no se vuelve
la fuente de verdad ni dicta la identidad de un registro.

## Lo implementado: exportación portable

`GET /api/v1/integrations/exports/{resource}/` ofrece CSV de contactos,
propiedades o citas. La exportación usa el mismo alcance por rol que la API:
un asesor no obtiene información de otro asesor y gerencia/administración ven
la operación completa.

Características actuales:

- codificación UTF-8 con BOM para compatibilidad con herramientas de oficina;
- `Content-Disposition` de descarga y nombre de archivo explícito;
- encabezados estables en español;
- UUID de registros para conciliación sin depender de nombres;
- sin llamadas a terceros ni sincronización automática.

Una exportación es una copia puntual. No implica permiso para enviar datos
personales a una herramienta externa ni satisface una política de respaldo.

## Archivos y medios

Los adjuntos de propiedades se suben mediante Django y se referencian desde
`PropertyMedia`. PostgreSQL no contiene los binarios. En local, `MEDIA_ROOT`
es suficiente para desarrollo; en producción se debe elegir almacenamiento
durable separado y definir:

1. control de acceso a lectura y escritura;
2. escaneo de archivos y tipos realmente permitidos;
3. límites de cuota y tamaño;
4. backup/retención coordinada con la base;
5. proceso de eliminación y recuperación;
6. URLs privadas o temporales si los medios no son públicos.

No expongas un bucket, una ruta de disco ni una credencial en serializers,
frontend, `.env.example` o documentación pública.

## Antes de añadir un proveedor

Un conector de correo, calendario, anuncios, firma, facturación, mapas,
mensajería o CRM debe llegar con una decisión escrita que cubra:

| Pregunta | Decisión necesaria |
| --- | --- |
| Propósito | Qué resultado de negocio obtiene y qué no se resuelve todavía. |
| Propiedad de datos | Qué registros siguen siendo canónicos en Módulo. |
| Identidad | Cómo se mapea el ID externo sin reemplazar UUID internos. |
| Autenticación | Dónde viven secretos, scopes, renovación y revocación. |
| Fallos | Reintentos, idempotencia, cola si aplica, alertas y conciliación. |
| Privacidad | Datos enviados, base legal/consentimiento, retención y borrado. |
| Coste | Límites, cuotas y comportamiento cuando se agota un plan. |
| Pruebas | Mocks, sandbox del proveedor y casos de degradación. |

El adaptador se implementa en `backend/integrations/` o en una app de borde
equivalente. Los modelos de dominio no deben importarlo para realizar llamadas
de red durante `save()`.

## Webhooks e idempotencia

Si un proveedor envía webhooks, valida firma y hora, guarda el identificador
externo de entrega para deduplicar, responde rápido y procesa trabajo pesado
fuera del request. Define cómo se reintenta y cómo se inspeccionan eventos
fallidos. Un webhook puede duplicarse, llegar fuera de orden o no llegar.

No marques un cierre, pago, firma o consentimiento como definitivo solo porque
llegó un payload no verificado. Esa transición requiere reglas explícitas de
dominio, auditoría y pruebas de concurrencia.

## Configuración y secretos

Las credenciales se suministran mediante variables de entorno o un gestor de
secretos del despliegue. `backend/.env.example` puede nombrar una variable pero
no contiene valores reales. Nunca copies secretos a fixtures, seeds, historial
Git, salidas de prueba o tickets.

Para desarrollo sin proveedores, los tests deben sustituir la capa externa. Un
fallo de Internet, una clave ausente o una API de prueba no puede hacer que una
prueba unitaria de CRM deje de ser determinista.
