# Requirements Document

## Introduction

Este documento define los requisitos para implementar endpoints CRUD completos para el rol de SuperUsuario en la aplicación NestJS de gestión médica. El SuperUsuario necesita acceso administrativo total a todas las entidades del sistema para gestionar la aplicación desde el frontend.

## Glossary

- **SuperUsuario**: Usuario con privilegios administrativos máximos que puede realizar operaciones CRUD en todas las entidades del sistema
- **CRUD_Endpoint**: Conjunto de endpoints HTTP que permiten Create (POST), Read (GET), Update (PUT/PATCH), Delete (DELETE) sobre una entidad
- **Sistema**: La aplicación NestJS de gestión médica
- **Entidad**: Tabla de base de datos representada por una clase TypeORM con decorador @Entity
- **Soft_Delete**: Eliminación lógica que marca un registro como eliminado sin borrarlo físicamente de la base de datos
- **JWT_Guard**: Guard de autenticación que valida tokens JWT
- **Roles_Guard**: Guard de autorización que valida roles de usuario
- **Swagger**: Herramienta de documentación OpenAPI para endpoints REST
- **DTO**: Data Transfer Object - objeto que define la estructura de datos para requests/responses

## Requirements

### Requirement 1: Autenticación y Autorización del SuperUsuario

**User Story:** Como SuperUsuario, quiero que todos los endpoints CRUD estén protegidos con autenticación JWT y validación de rol, para que solo usuarios autorizados puedan acceder a las operaciones administrativas.

#### Acceptance Criteria

1. THE Sistema SHALL aplicar JWT_Guard a todos los endpoints CRUD del SuperUsuario
2. THE Sistema SHALL aplicar Roles_Guard con rol "SuperUsuario" a todos los endpoints CRUD administrativos
3. WHEN un usuario sin rol SuperUsuario intenta acceder a un endpoint CRUD administrativo, THE Sistema SHALL retornar código HTTP 403 (Forbidden)
4. WHEN un usuario no autenticado intenta acceder a un endpoint CRUD administrativo, THE Sistema SHALL retornar código HTTP 401 (Unauthorized)

### Requirement 2: Gestión de SuperUsuarios

**User Story:** Como SuperUsuario, quiero poder crear y gestionar otros SuperUsuarios, para que pueda delegar responsabilidades administrativas.

#### Acceptance Criteria

1. THE Sistema SHALL proveer endpoint POST /super-admin/usuarios para crear nuevos SuperUsuarios
2. WHEN se crea un SuperUsuario, THE Sistema SHALL asignar automáticamente el rol "SuperUsuario" en la tabla roles
3. THE Sistema SHALL proveer endpoint GET /super-admin/usuarios para listar todos los usuarios con rol SuperUsuario
4. THE Sistema SHALL proveer endpoint PUT /super-admin/usuarios/:id para actualizar datos de un SuperUsuario
5. THE Sistema SHALL proveer endpoint DELETE /super-admin/usuarios/:id para desactivar un SuperUsuario usando soft delete

### Requirement 3: Endpoints CRUD para Entidades de Usuarios

**User Story:** Como SuperUsuario, quiero gestionar todas las entidades relacionadas con usuarios (personas, estudiantes, docentes, consultores, administrativos), para mantener actualizada la información del sistema.

#### Acceptance Criteria

1. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Persona (GET, GET/:id, POST, PUT/:id, DELETE/:id)
2. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Estudiante
3. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Docente
4. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Consultor
5. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Administrativo
6. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Usuario
7. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Rol
8. THE Sistema SHALL proveer endpoints CRUD completos para la entidad HistorialUsuario
9. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ContratoConsultor

### Requirement 4: Endpoints CRUD para Entidades Médicas

**User Story:** Como SuperUsuario, quiero gestionar todas las entidades médicas (doctores, especialidades, postas, consultorios, derivaciones), para administrar la infraestructura médica del sistema.

#### Acceptance Criteria

1. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Doctor
2. THE Sistema SHALL proveer endpoints CRUD completos para la entidad EspecialidadMedica
3. THE Sistema SHALL proveer endpoints CRUD completos para la entidad PostaMedica
4. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ConsultorioEspecialidad
5. THE Sistema SHALL proveer endpoints CRUD completos para la entidad AsignacionDoctorConsultorio
6. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Derivacion
7. THE Sistema SHALL proveer endpoints CRUD completos para la entidad FechaCierre

### Requirement 5: Endpoints CRUD para Entidades de Citas y Reservas

**User Story:** Como SuperUsuario, quiero gestionar reservas, consultas y pagos, para poder resolver problemas administrativos y mantener la integridad de los datos.

#### Acceptance Criteria

1. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ReservaPaciente
2. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ReservaPacienteCancelada
3. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ConsultaMedica
4. THE Sistema SHALL proveer endpoints CRUD completos para la entidad Pago
5. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ConfiguracionReservaConsulta

### Requirement 6: Endpoints CRUD para Entidades de Contenido

**User Story:** Como SuperUsuario, quiero gestionar el contenido del sistema como consejos diarios, para mantener actualizada la información que se muestra a los usuarios.

#### Acceptance Criteria

1. THE Sistema SHALL proveer endpoints CRUD completos para la entidad ConsejoDiario

### Requirement 7: Operaciones de Eliminación con Soft Delete

**User Story:** Como SuperUsuario, quiero que las eliminaciones sean lógicas (soft delete) en lugar de físicas, para mantener un historial completo y poder recuperar datos si es necesario.

#### Acceptance Criteria

1. WHEN se ejecuta DELETE en cualquier endpoint CRUD, THE Sistema SHALL realizar soft delete usando el campo deletedAt de TypeORM
2. THE Sistema SHALL excluir registros con soft delete de las consultas GET por defecto
3. WHERE la entidad tiene columna DeleteDateColumn, THE Sistema SHALL usar TypeORM soft delete
4. WHERE la entidad tiene campo "activo", THE Sistema SHALL establecer activo=false en lugar de soft delete

### Requirement 8: Validación de Datos de Entrada

**User Story:** Como SuperUsuario, quiero que todos los datos de entrada sean validados, para prevenir errores y mantener la integridad de los datos.

#### Acceptance Criteria

1. THE Sistema SHALL validar todos los DTOs usando class-validator
2. WHEN un request contiene datos inválidos, THE Sistema SHALL retornar código HTTP 400 con mensajes de error descriptivos
3. THE Sistema SHALL validar tipos de datos, longitudes, formatos y restricciones de negocio
4. THE Sistema SHALL validar relaciones entre entidades antes de crear o actualizar registros

### Requirement 9: Respuestas HTTP Estandarizadas

**User Story:** Como desarrollador frontend, quiero respuestas HTTP consistentes y predecibles, para facilitar el manejo de respuestas en el cliente.

#### Acceptance Criteria

1. WHEN una operación GET/:id es exitosa, THE Sistema SHALL retornar código HTTP 200 con la entidad
2. WHEN una operación GET/:id no encuentra el recurso, THE Sistema SHALL retornar código HTTP 404
3. WHEN una operación POST es exitosa, THE Sistema SHALL retornar código HTTP 201 con la entidad creada
4. WHEN una operación PUT/:id es exitosa, THE Sistema SHALL retornar código HTTP 200 con la entidad actualizada
5. WHEN una operación DELETE/:id es exitosa, THE Sistema SHALL retornar código HTTP 200 o 204
6. WHEN ocurre un error de validación, THE Sistema SHALL retornar código HTTP 400 con detalles del error
7. WHEN ocurre un error interno, THE Sistema SHALL retornar código HTTP 500 con mensaje genérico

### Requirement 10: Documentación Swagger Completa

**User Story:** Como desarrollador frontend, quiero documentación Swagger completa de todos los endpoints, para entender cómo consumir la API sin revisar el código fuente.

#### Acceptance Criteria

1. THE Sistema SHALL documentar todos los endpoints CRUD con decoradores @ApiOperation
2. THE Sistema SHALL documentar todos los parámetros de ruta con @ApiParam
3. THE Sistema SHALL documentar todos los request bodies con @ApiBody
4. THE Sistema SHALL documentar todas las respuestas posibles con @ApiResponse
5. THE Sistema SHALL agrupar endpoints por entidad usando @ApiTags
6. THE Sistema SHALL documentar esquemas de DTOs con @ApiProperty
7. THE Sistema SHALL incluir ejemplos de request/response en la documentación
8. THE Sistema SHALL documentar requisitos de autenticación con @ApiBearerAuth

### Requirement 11: Paginación para Listados

**User Story:** Como SuperUsuario, quiero que los listados de entidades soporten paginación, para manejar eficientemente grandes volúmenes de datos.

#### Acceptance Criteria

1. THE Sistema SHALL aceptar parámetros query "page" y "limit" en endpoints GET de listado
2. WHEN se solicita un listado sin parámetros de paginación, THE Sistema SHALL aplicar valores por defecto (page=1, limit=10)
3. THE Sistema SHALL retornar metadata de paginación (total, page, limit, totalPages) junto con los datos
4. THE Sistema SHALL validar que page y limit sean números positivos

### Requirement 12: Filtrado y Búsqueda en Listados

**User Story:** Como SuperUsuario, quiero poder filtrar y buscar en los listados, para encontrar rápidamente registros específicos.

#### Acceptance Criteria

1. WHERE un endpoint GET de listado recibe parámetros de filtro, THE Sistema SHALL aplicar filtros a la consulta
2. THE Sistema SHALL soportar búsqueda por texto en campos relevantes usando LIKE o ILIKE
3. THE Sistema SHALL soportar filtrado por campos booleanos (activo, eliminado)
4. THE Sistema SHALL soportar filtrado por rangos de fechas

### Requirement 13: Manejo de Relaciones entre Entidades

**User Story:** Como SuperUsuario, quiero que las respuestas incluyan relaciones relevantes, para obtener información completa sin múltiples requests.

#### Acceptance Criteria

1. WHEN se solicita una entidad con GET/:id, THE Sistema SHALL incluir relaciones de primer nivel usando TypeORM relations
2. THE Sistema SHALL permitir parámetro query "relations" para especificar qué relaciones cargar
3. THE Sistema SHALL validar que las relaciones solicitadas existan en la entidad
4. WHEN se crea o actualiza una entidad con relaciones, THE Sistema SHALL validar que las entidades relacionadas existan

### Requirement 14: Logging de Operaciones Administrativas

**User Story:** Como administrador del sistema, quiero que todas las operaciones CRUD del SuperUsuario queden registradas, para auditoría y trazabilidad.

#### Acceptance Criteria

1. WHEN un SuperUsuario ejecuta una operación CREATE, THE Sistema SHALL registrar en logs: usuario, timestamp, entidad, datos creados
2. WHEN un SuperUsuario ejecuta una operación UPDATE, THE Sistema SHALL registrar en logs: usuario, timestamp, entidad, ID, cambios realizados
3. WHEN un SuperUsuario ejecuta una operación DELETE, THE Sistema SHALL registrar en logs: usuario, timestamp, entidad, ID eliminado
4. THE Sistema SHALL usar el logger de NestJS para registrar operaciones administrativas

### Requirement 15: Organización de Código en Módulo Dedicado

**User Story:** Como desarrollador, quiero que todo el código de administración del SuperUsuario esté organizado en un módulo dedicado, para mantener el código limpio y mantenible.

#### Acceptance Criteria

1. THE Sistema SHALL crear un módulo SuperAdminModule separado
2. THE Sistema SHALL organizar controllers por dominio (usuarios, médico, citas, contenido)
3. THE Sistema SHALL crear services reutilizables para operaciones CRUD genéricas
4. THE Sistema SHALL mantener DTOs específicos para cada entidad en carpetas organizadas
5. THE Sistema SHALL registrar el SuperAdminModule en AppModule
