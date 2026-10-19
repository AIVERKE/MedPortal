# Implementation Plan: Super Admin CRUD Endpoints

## Overview

Este plan implementa endpoints CRUD completos para el rol de SuperUsuario en la aplicación NestJS de gestión médica. La implementación se organiza en fases incrementales: configuración inicial, servicios base genéricos, controllers por dominio (Users, Medical, Appointments, Content), DTOs de validación, interceptor de auditoría, y testing. Cada fase construye sobre la anterior, asegurando que el código se integre progresivamente sin dejar componentes huérfanos.

## Tasks

- [ ] 1. Configurar estructura del módulo SuperAdmin
  - Crear directorio src/super-admin con subdirectorios (controllers, services, dto, interceptors)
  - Crear SuperAdminModule con imports de TypeORM para las 21 entidades
  - Registrar SuperAdminModule en AppModule
  - _Requirements: 15.1, 15.2, 15.5_

- [ ] 2. Implementar BaseCrudService genérico
  - [ ] 2.1 Crear BaseCrudService<T> con operaciones CRUD genéricas
    - Implementar findAll con soporte para paginación, filtrado, búsqueda y relaciones
    - Implementar findOne con carga opcional de relaciones
    - Implementar create con validación de relaciones
    - Implementar update con validación de existencia y relaciones
    - Implementar softDelete y restore diferenciando DeleteDateColumn vs campo activo
    - _Requirements: 7.1, 7.3, 7.4, 11.1, 11.2, 12.1, 13.1_

  - [ ]* 2.2 Escribir property test para soft delete con DeleteDateColumn
    - **Property 4: Soft delete con DeleteDateColumn**
    - **Valida: Requirements 7.1, 7.2, 7.3**

  - [ ]* 2.3 Escribir property test para desactivación mediante campo activo
    - **Property 5: Desactivación mediante campo activo**
    - **Valida: Requirements 7.4**

  - [ ]* 2.4 Escribir property test para paginación con valores por defecto
    - **Property 10: Paginación con valores por defecto**
    - **Valida: Requirements 11.1, 11.2, 11.3**

  - [ ]* 2.5 Escribir property test para validación de parámetros de paginación
    - **Property 11: Validación de parámetros de paginación**
    - **Valida: Requirements 11.4**

  - [ ]* 2.6 Escribir property test para aplicación de filtros dinámicos
    - **Property 12: Aplicación de filtros dinámicos**
    - **Valida: Requirements 12.1, 12.2, 12.3, 12.4**


  - [ ]* 2.7 Escribir property test para carga de relaciones
    - **Property 13: Carga de relaciones**
    - **Valida: Requirements 13.1, 13.2, 13.3**

  - [ ]* 2.8 Escribir tests unitarios para BaseCrudService
    - Test casos específicos: creación exitosa, actualización con ID inexistente, filtrado por múltiples campos
    - Test edge cases: paginación con límite 0, búsqueda con string vacío, relaciones inexistentes
    - _Requirements: 7.1, 11.1, 12.1, 13.1_

- [ ] 3. Crear DTOs comunes y de paginación
  - Crear PaginationDto con validación de page, limit, orderBy, orderDirection
  - Crear interfaces FindAllOptions y PaginatedResponse
  - Documentar con decoradores @ApiProperty de Swagger
  - _Requirements: 8.1, 8.3, 10.1, 10.6, 11.4_

- [ ] 4. Implementar AuditLogInterceptor
  - [ ] 4.1 Crear AuditLogInterceptor para logging de operaciones administrativas
    - Capturar método HTTP, URL, usuario, timestamp, body y params
    - Sanitizar campos sensibles (password)
    - Registrar operaciones exitosas y errores con NestJS Logger
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 4.2 Escribir property test para logging de operaciones administrativas
    - **Property 14: Logging de operaciones administrativas**
    - **Valida: Requirements 14.1, 14.2, 14.3**

  - [ ]* 4.3 Escribir tests unitarios para AuditLogInterceptor
    - Test sanitización de passwords en logs
    - Test formato de logs para CREATE, UPDATE, DELETE
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 5. Checkpoint - Verificar servicios base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implementar DTOs del dominio Users
  - [ ] 6.1 Crear DTOs para Usuario (CreateUsuarioDto, UpdateUsuarioDto)
    - Validar username (3-50 chars), password (min 8 chars), idPersona (número positivo)
    - Documentar con @ApiProperty incluyendo ejemplos
    - _Requirements: 2.1, 3.6, 8.1, 8.3, 10.6_

  - [ ] 6.2 Crear DTOs para Persona (CreatePersonaDto, UpdatePersonaDto)
    - Validar CI, nombres, apellidos, email, celular, fechaNacimiento
    - _Requirements: 3.1, 8.1, 8.3_

  - [ ] 6.3 Crear DTOs para Estudiante, Docente, Consultor, Administrativo
    - Validar campos específicos de cada tipo de usuario
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.1_

  - [ ] 6.4 Crear DTOs para Rol, HistorialUsuario, ContratoConsultor
    - Validar nombreRol, accion, fechas, montos
    - _Requirements: 3.7, 3.8, 3.9, 8.1_

  - [ ]* 6.5 Escribir property test para validación de DTOs
    - **Property 6: Validación de DTOs**
    - **Valida: Requirements 8.1, 8.2, 8.3**

  - [ ]* 6.6 Escribir property test para validación de relaciones
    - **Property 7: Validación de relaciones**
    - **Valida: Requirements 8.4**

- [ ] 7. Implementar UsersAdminController
  - [ ] 7.1 Crear UsersAdminController con guards y decoradores
    - Aplicar @UseGuards(JwtAuthGuard, RolesGuard) y @Roles('SuperUsuario')
    - Aplicar @UseInterceptors(AuditLogInterceptor)
    - Configurar @ApiTags('Super Admin - Users') y @ApiBearerAuth()
    - _Requirements: 1.1, 1.2, 15.2_

  - [ ] 7.2 Implementar endpoints CRUD para Usuario
    - GET /super-admin/users/usuarios (listar con paginación)
    - GET /super-admin/users/usuarios/:id (obtener uno con relaciones)
    - POST /super-admin/users/usuarios (crear con asignación automática de rol SuperUsuario)
    - PUT /super-admin/users/usuarios/:id (actualizar)
    - DELETE /super-admin/users/usuarios/:id (soft delete)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.6_

  - [ ] 7.3 Implementar endpoints CRUD para Persona
    - GET /super-admin/users/personas, GET /:id, POST, PUT /:id, DELETE /:id
    - _Requirements: 3.1_

  - [ ] 7.4 Implementar endpoints CRUD para Estudiante, Docente, Consultor, Administrativo
    - Endpoints completos para cada entidad siguiendo el mismo patrón
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.5 Implementar endpoints CRUD para Rol, HistorialUsuario, ContratoConsultor
    - Endpoints completos para cada entidad
    - _Requirements: 3.7, 3.8, 3.9_

  - [ ] 7.6 Documentar todos los endpoints con Swagger
    - Aplicar @ApiOperation, @ApiParam, @ApiBody, @ApiResponse a cada endpoint
    - Incluir ejemplos de request/response
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7, 10.8_

  - [ ]* 7.7 Escribir property test para autenticación JWT requerida
    - **Property 1: Autenticación JWT requerida**
    - **Valida: Requirements 1.1, 1.4**

  - [ ]* 7.8 Escribir property test para autorización de rol SuperUsuario
    - **Property 2: Autorización de rol SuperUsuario requerida**
    - **Valida: Requirements 1.2, 1.3**

  - [ ]* 7.9 Escribir property test para asignación automática de rol
    - **Property 3: Asignación automática de rol SuperUsuario**
    - **Valida: Requirements 2.2**

  - [ ]* 7.10 Escribir tests unitarios para UsersAdminController
    - Test creación de usuario con datos válidos
    - Test actualización de persona existente
    - Test listado con filtros específicos
    - Test error 404 al buscar ID inexistente
    - _Requirements: 2.1, 3.1, 3.6, 9.2_

- [ ] 8. Checkpoint - Verificar módulo Users
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implementar DTOs del dominio Medical
  - [ ] 9.1 Crear DTOs para Doctor (CreateDoctorDto, UpdateDoctorDto)
    - Validar idPersona, idEspecialidadMedica, matriculaProfesional
    - _Requirements: 4.1, 8.1_

  - [ ] 9.2 Crear DTOs para EspecialidadMedica, PostaMedica
    - Validar nombres, descripciones, direcciones, teléfonos
    - _Requirements: 4.2, 4.3, 8.1_

  - [ ] 9.3 Crear DTOs para ConsultorioEspecialidad, AsignacionDoctorConsultorio
    - Validar relaciones, horarios, capacidades
    - _Requirements: 4.4, 4.5, 8.1_

  - [ ] 9.4 Crear DTOs para Derivacion, FechaCierre
    - Validar estados, motivos, fechas
    - _Requirements: 4.6, 4.7, 8.1_

- [ ] 10. Implementar MedicalAdminController
  - [ ] 10.1 Crear MedicalAdminController con guards y decoradores
    - Aplicar guards, interceptor, tags Swagger
    - _Requirements: 1.1, 1.2, 15.2_

  - [ ] 10.2 Implementar endpoints CRUD para Doctor
    - GET /super-admin/medical/doctores, GET /:id, POST, PUT /:id, DELETE /:id
    - _Requirements: 4.1_

  - [ ] 10.3 Implementar endpoints CRUD para EspecialidadMedica, PostaMedica
    - Endpoints completos para especialidades-medicas y postas-medicas
    - _Requirements: 4.2, 4.3_

  - [ ] 10.4 Implementar endpoints CRUD para ConsultorioEspecialidad, AsignacionDoctorConsultorio
    - Endpoints completos para consultorios-especialidad y asignaciones-doctor-consultorio
    - _Requirements: 4.4, 4.5_

  - [ ] 10.5 Implementar endpoints CRUD para Derivacion, FechaCierre
    - Endpoints completos para derivaciones y fechas-cierre
    - _Requirements: 4.6, 4.7_

  - [ ] 10.6 Documentar todos los endpoints con Swagger
    - Aplicar decoradores completos de documentación
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 10.7 Escribir tests unitarios para MedicalAdminController
    - Test creación de doctor con especialidad válida
    - Test asignación de doctor a consultorio
    - Test filtrado de derivaciones por estado
    - _Requirements: 4.1, 4.5, 4.6_

- [ ] 11. Implementar DTOs del dominio Appointments
  - [ ] 11.1 Crear DTOs para ReservaPaciente (CreateReservaPacienteDto, UpdateReservaPacienteDto)
    - Validar idUsuario, idEspecialidad, idPosta, idDoctor, fechaCita, horarios
    - _Requirements: 5.1, 8.1_

  - [ ] 11.2 Crear DTOs para ReservaPacienteCancelada, ConsultaMedica
    - Validar motivos de cancelación, diagnósticos, tratamientos
    - _Requirements: 5.2, 5.3, 8.1_

  - [ ] 11.3 Crear DTOs para Pago, ConfiguracionReservaConsulta
    - Validar montos, métodos de pago, configuraciones de horarios
    - _Requirements: 5.4, 5.5, 8.1_

- [ ] 12. Implementar AppointmentsAdminController
  - [ ] 12.1 Crear AppointmentsAdminController con guards y decoradores
    - Aplicar guards, interceptor, tags Swagger
    - _Requirements: 1.1, 1.2, 15.2_

  - [ ] 12.2 Implementar endpoints CRUD para ReservaPaciente
    - GET /super-admin/appointments/reservas, GET /:id, POST, PUT /:id, DELETE /:id
    - _Requirements: 5.1_

  - [ ] 12.3 Implementar endpoints CRUD para ReservaPacienteCancelada, ConsultaMedica
    - Endpoints completos para reservas-canceladas y consultas-medicas
    - _Requirements: 5.2, 5.3_

  - [ ] 12.4 Implementar endpoints CRUD para Pago, ConfiguracionReservaConsulta
    - Endpoints completos para pagos y configuraciones-reserva-consulta
    - _Requirements: 5.4, 5.5_

  - [ ] 12.5 Documentar todos los endpoints con Swagger
    - Aplicar decoradores completos de documentación
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 12.6 Escribir tests unitarios para AppointmentsAdminController
    - Test creación de reserva con validación de horarios
    - Test consulta médica con pago asociado
    - Test filtrado de reservas por fecha
    - _Requirements: 5.1, 5.3, 5.4_

- [ ] 13. Implementar DTOs del dominio Content
  - Crear DTOs para ConsejoDiario (CreateConsejoDiarioDto, UpdateConsejoDiarioDto)
  - Validar titulo, contenido, categoria, fechaPublicacion
  - _Requirements: 6.1, 8.1_

- [ ] 14. Implementar ContentAdminController
  - [ ] 14.1 Crear ContentAdminController con guards y decoradores
    - Aplicar guards, interceptor, tags Swagger
    - _Requirements: 1.1, 1.2, 15.2_

  - [ ] 14.2 Implementar endpoints CRUD para ConsejoDiario
    - GET /super-admin/content/consejos-diarios, GET /:id, POST, PUT /:id, DELETE /:id
    - DELETE debe establecer activo=false (no usar soft delete)
    - _Requirements: 6.1, 7.4_

  - [ ] 14.3 Documentar todos los endpoints con Swagger
    - Aplicar decoradores completos de documentación
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 14.4 Escribir tests unitarios para ContentAdminController
    - Test creación de consejo diario
    - Test desactivación mediante campo activo
    - Test filtrado por categoría
    - _Requirements: 6.1, 7.4_

- [ ] 15. Checkpoint - Verificar todos los controllers
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implementar manejo de errores y respuestas HTTP
  - [ ] 16.1 Crear AllExceptionsFilter global
    - Capturar HttpException, QueryFailedError y errores genéricos
    - Transformar errores de base de datos (unique violations) en respuestas apropiadas
    - Logging de errores con stack traces
    - _Requirements: 9.6, 9.7_

  - [ ] 16.2 Configurar ValidationPipe global
    - Aplicar en main.ts con whitelist: true, forbidNonWhitelisted: true
    - _Requirements: 8.1, 8.2_

  - [ ]* 16.3 Escribir property test para respuestas HTTP estándar
    - **Property 8: Respuestas HTTP estándar para operaciones exitosas**
    - **Valida: Requirements 9.1, 9.3, 9.4, 9.5**

  - [ ]* 16.4 Escribir property test para respuesta 404
    - **Property 9: Respuesta 404 para recursos no encontrados**
    - **Valida: Requirements 9.2**

  - [ ]* 16.5 Escribir tests unitarios para manejo de errores
    - Test respuesta 401 sin token JWT
    - Test respuesta 403 con rol incorrecto
    - Test respuesta 409 con username duplicado
    - Test respuesta 500 para errores inesperados
    - _Requirements: 1.3, 1.4, 9.7_

- [ ] 17. Integración final y verificación
  - [ ] 17.1 Verificar que SuperAdminModule está registrado en AppModule
    - Confirmar imports y exports correctos
    - _Requirements: 15.5_

  - [ ] 17.2 Verificar documentación Swagger completa
    - Acceder a /api/docs y verificar que todos los endpoints están documentados
    - Verificar agrupación por tags (Users, Medical, Appointments, Content)
    - Verificar que @ApiBearerAuth está aplicado
    - _Requirements: 10.1, 10.5, 10.8_

  - [ ] 17.3 Ejecutar suite completa de tests
    - Ejecutar npm test y verificar que todos los tests pasan
    - Verificar cobertura de código > 80%
    - _Requirements: Todos_

- [ ] 18. Checkpoint final - Validación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental del progreso
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan casos específicos y edge cases
- La implementación sigue un enfoque incremental: servicios base → DTOs → controllers por dominio → integración
- Todas las entidades usan soft delete excepto ConsejoDiario que usa campo activo
- La documentación Swagger se completa junto con cada controller
