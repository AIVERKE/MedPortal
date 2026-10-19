# MedPortal

Sistema de administración de datos clínicos y reservas para las postas de salud de la UMSA (proyecto SADC-UMSA).

El repositorio es un monorepo con dos aplicaciones:

| Carpeta     | Descripción                     | Tecnologías                                   |
| ----------- | ------------------------------- | --------------------------------------------- |
| `backend/`  | API REST                        | NestJS 11, TypeORM, PostgreSQL, JWT, Swagger  |
| `frontend/` | Panel web de administración     | Vue 3, Vite, Vuetify, Pinia, Vue Router       |

## Requisitos previos

- [Node.js](https://nodejs.org/) 22 LTS (el backend se valida con Node 22 y el frontend con Node 20 en CI)
- npm 10 o superior
- [PostgreSQL](https://www.postgresql.org/) 13 o superior
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AIVERKE/MedPortal.git
cd MedPortal
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` con tus datos. Las variables mínimas para desarrollo son:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=sadc_umsa
DB_SYNCHRONIZE=True
JWT_SECRET=clave_secreta_desarrollo
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Crea la base de datos vacía en PostgreSQL con el mismo nombre que `DB_DATABASE`:

```bash
createdb -U postgres sadc_umsa
```

Con `DB_SYNCHRONIZE=True` las tablas se crean automáticamente al iniciar (solo para desarrollo). En producción usa `DB_SYNCHRONIZE=False` y aplica las migraciones:

```bash
npm run migration:run
```

Opcionalmente, carga datos de prueba con los scripts de `backend/docs/` (por ejemplo `seed-completo-sistema.sql` o `test.users.sql`):

```bash
psql -U postgres -d sadc_umsa -f docs/test.users.sql
```

Inicia el servidor en modo desarrollo:

```bash
npm run start:dev
```

- API: http://localhost:3000
- Documentación Swagger: http://localhost:3000/api

### 3. Frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

`VITE_API_URL` en `frontend/.env.local` debe apuntar a la URL del backend (por defecto `http://localhost:3000`). La aplicación queda disponible en http://localhost:5173.

## Scripts útiles

### Backend (`backend/`)

| Comando                      | Descripción                                 |
| ---------------------------- | ------------------------------------------- |
| `npm run start:dev`          | Servidor con recarga automática             |
| `npm run build`              | Compila a `dist/`                           |
| `npm run start:prod`         | Ejecuta la versión compilada                |
| `npm run lint`               | Revisa y corrige el estilo con ESLint       |
| `npm test`                   | Pruebas unitarias (Jest)                    |
| `npm run test:e2e`           | Pruebas end-to-end                          |
| `npm run migration:generate` | Genera una migración a partir de entidades  |
| `npm run migration:run`      | Aplica migraciones pendientes               |
| `npm run migration:revert`   | Revierte la última migración                |

### Frontend (`frontend/`)

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Servidor de desarrollo de Vite       |
| `npm run build`   | Compila a `dist/` para producción    |
| `npm run preview` | Sirve localmente la build compilada  |

## CI/CD (GitHub Actions)

Los workflows están en `.github/workflows/`:

- **`backend-ci.yml`**: en cada push o pull request a `main`/`develop` que toque `backend/`, instala dependencias, ejecuta ESLint, verifica tipos con `tsc --noEmit` y compila.
- **`frontend-ci.yml`**: en cada push o pull request a `main`/`develop` que toque `frontend/`, instala dependencias y compila con Vite.
- **`cd.yml`**: en cada push a `main` (o manualmente desde la pestaña Actions) compila backend y frontend.

## Estructura del repositorio

```
MedPortal/
├── .github/workflows/   # CI y CD
├── backend/             # API NestJS
│   ├── src/
│   ├── test/
│   └── docs/            # Scripts SQL de datos de prueba
└── frontend/            # Aplicación Vue 3
    ├── src/
    └── public/
```
