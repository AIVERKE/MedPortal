# MedPortal (Frontend)

Aplicación frontend en Vue 3 + Vite para el proyecto SADC-UMSA — interfaz de administración de reservas y configuración de postas. Diseñada para integrarse con el backend (NestJS + PostgreSQL) ubicado en ../backend.

## Tecnologías principales
- Vue 3 (Composition API, <script setup>)
- Vite
- Pinia (stores)
- Vuetify (componentes UI)
- JavaScript / ECMAScript moderno

## Requisitos
- Node.js v18+ (recomendado)
- npm (o yarn/pnpm)
- Backend corriendo para integración completa (opcional para desarrollo local)

En Windows (PowerShell / CMD):
- Instala Node.js desde https://nodejs.org/

## Instalación
Desde la carpeta del proyecto frontend:

Windows (PowerShell)
```powershell
git clone https://github.com/AIVERKE/MedPortal.git
cd MedPortal\frontend
npm install
```

## Variables de entorno
Vite carga variables desde archivos `.env`. Crea `.env.local` en la raíz del frontend con al menos:

```env
VITE_APP_TITLE=Front Postas UMSA
VITE_API_URL=http://localhost:3000
```

- VITE_API_URL: URL base del backend (ajusta puerto según backend).
- Prefijo VITE_ es obligatorio para exponer variables al cliente.

## Scripts útiles
Ejecutar en desarrollo (hot-reload):
```bash
npm run dev
# o (Windows PowerShell)
npm run dev -- --host
```

Compilar para producción:
```bash
npm run build
```

Previsualizar build (servidor estático):
```bash
npm run preview
```

Lint / formateo (si está configurado):
```bash
npm run lint
npm run format
```

## Conexión con el backend
- Ajusta VITE_API_URL en `.env.local`.
- El store (src/stores) centraliza llamadas a APIs. Reemplaza los placeholders por endpoints reales cuando el backend esté listo.
- Para pruebas rápidas sin backend, algunos stores usan localStorage como placeholder.

## Estructura de carpetas (relevante)
- src/
  - components/ (componentes reutilizables)
  - views/ (vistas / rutas)
  - stores/ (Pinia — lógica de datos / APIs)
  - router/ (rutas)
  - assets/
  - App.vue, main.js

Convención: cada store en src/stores sigue patrón similar a `unidades_mof.js`.

## Desarrollo y pruebas
- Usa Pinia Devtools y Vue Devtools para inspeccionar estado y componentes.
- Para pruebas end-to-end o unitarias, añade configuración de Vitest / Cypress cuando sea necesario.

## Despliegue
- Construye con `npm run build` y sirve la carpeta `dist` con un servidor estático (nginx, surge, vercel, netlify, etc.).
- Asegura que VITE_API_URL apunte al backend de producción.

## Notas
- Evitar nombres de archivo con caracteres acentuados.
- Si agregas nuevas stores, sigue patrón de `src/stores` (estado, loading, error, fetch/save).
- Para cualquier duda de integración con el backend consulta
