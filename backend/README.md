# SADC-UMSA Backend

Sistema de Administración de Datos Clínicos y Hospitalarios para el proyecto SADC-UMSA.
Este backend está desarrollado en **Node.js** utilizando el framework **NestJS**, con **PostgreSQL** como base de datos y **TypeORM**.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior)
- **npm** (Gestor de paquetes de Node)
- **PostgreSQL** (v13 o superior)

## 🚀 Instalación y Configuración

Sigue estos pasos para configurar el proyecto en tu máquina local:

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/AIVERKE/MedPortal.git
    cd MedPortal/backend
    ```

2.  **Instalar dependencias:**

    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**

    Copia el archivo de ejemplo y crea tu propio archivo `.env`:

    ```bash
    cp .env.example .env
    ```

    Edita el archivo `.env` con tus credenciales de PostgreSQL:

    ```env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres  <-- Tu usuario
    DB_PASSWORD=secret    <-- Tu contraseña
    DB_DATABASE=postas_umsa
    JWT_SECRET=clave_secreta_desarrollo
    ```

4.  **Crear la Base de Datos:**

    Asegúrate de crear la base de datos vacía en Postgres con el mismo nombre que pusiste en el `.env` (por defecto `postas_umsa`).

## ▶️ Ejecutar el Proyecto

Para iniciar el servidor en modo desarrollo:

```bash
npm run start:dev
```

Al iniciar, el sistema realizará automáticamente:

1.  **Conexión a BD:** Se conectará a Postgres.
2.  **Sincronización:** Creará las tablas automáticamente (solo en desarrollo).
3.  **Seeding:** Si la base de datos está vacía, creará un usuario Admin automáticamente.

## 💾 Base de Datos Migraciones

+ Generar: `npm run migration:generate -- src/migrations/`
    Compara las entidades con la DB y genera el SQL necesario.
+ Ejecutar: `npm run migration:run`
    Aplica todas las migraciones pendientes a la base de datos.
+ Revertir: `npm run migration:revert`
    Deshace la última migración ejecutada en la base de datos.
+ CLI Base: `npm run typeorm -- [comando]`
    Acceso directo a la interfaz de comandos de TypeORM.

## 📚 Documentación API (Swagger)

Una vez que el servidor esté corriendo, puedes ver la documentación interactiva de la API y probar los endpoints en:

👉 **http://localhost:3000/api**

## 🔐 Credenciales de Acceso (Usuario Semilla)

El sistema crea un usuario administrador por defecto la primera vez:

- **Username:** `admin`
- **Password:** `admin123`

También se crean usuarios de prueba en el archivo `test.users.sql`:

- **Username:** `test.doctor`
- **Password:** `password123`
- **Username:** `test.admin`
- **Password:** `password123`
- **Username:** `test.docente`
- **Password:** `password123`
- **Username:** `test.estudiante`
- **Password:** `password123`
- **Username:** `test.consultor`
- **Password:** `password123`

Puedes usar estas credenciales en el endpoint `/auth/login` del Swagger para obtener tu Token Bearer.

## 🛠️ Tecnologías Principales

- [NestJS](https://nestjs.com/) - Framework Backend
- [TypeORM](https://typeorm.io/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Base de Datos
- [Passport & JWT](https://docs.nestjs.com/security/authentication) - Autenticación
- [Swagger](https://docs.nestjs.com/openapi/introduction) - Documentación
