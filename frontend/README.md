# Frontend de Modulo

Cliente Angular independiente de Modulo. Usa Angular 21, Material, Transloco, PWA y Capacitor; el idioma de interfaz inicial es español.

Para preparar un clon completo en Windows, usa primero [`scripts/setup.ps1`](../scripts/setup.ps1) desde la raíz del repositorio. Los comandos siguientes sirven para trabajar solo en el frontend una vez preparado el proyecto.

```powershell
npm ci
npm start
```

La estructura vive en `src/app/core`, `layout`, `shared` y `features`. Los módulos funcionales se conectarán posteriormente a la API REST de Django.
