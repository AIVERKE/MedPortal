-- =============================================================================
-- SCRIPT PARA GENERAR USUARIOS DE PRUEBA (CONTRASEÑA: password123)
-- =============================================================================
BEGIN;
-- 1. Asegurar que existe al menos una especialidad médica
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto,
        visible,
        activo
    )
SELECT 'Medicina General',
    'MED-01',
    'Atención Primaria',
    20,
    true,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.especialidades_medicas
        WHERE codigo = 'MED-01'
    );
-- 2. Insertar Personas
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        genero,
        email,
        activo
    )
VALUES (
        '1000001',
        'Doctor',
        'Prueba',
        'Uno',
        'M',
        'doctor@test.com',
        true
    ),
    (
        '1000002',
        'Estudiante',
        'Prueba',
        'Dos',
        'F',
        'estudiante@test.com',
        true
    ),
    (
        '1000003',
        'Admin',
        'Prueba',
        'Tres',
        'M',
        'admin@test.com',
        true
    ),
    (
        '1000004',
        'Docente',
        'Prueba',
        'Cuatro',
        'F',
        'docente@test.com',
        true
    ),
    (
        '1000005',
        'Consultor',
        'Prueba',
        'Cinco',
        'M',
        'consultor@test.com',
        true
    ) ON CONFLICT (ci) DO NOTHING;
-- 3. Insertar Usuarios (Contraseña: password123)
-- Hash: $2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6
INSERT INTO public.usuarios (username, password, id_persona, fecha_creacion)
VALUES (
        'test.doctor',
        '$2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1000001'
        ),
        NOW()
    ),
    (
        'test.estudiante',
        '$2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1000002'
        ),
        NOW()
    ),
    (
        'test.admin',
        '$2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1000003'
        ),
        NOW()
    ),
    (
        'test.docente',
        '$2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1000004'
        ),
        NOW()
    ),
    (
        'test.consultor',
        '$2b$10$gl3fxwlko23nQxbcxws2deu1bazss5PH5tEWML6GhEopj//uDNeF6',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1000005'
        ),
        NOW()
    ) ON CONFLICT (username) DO NOTHING;
-- 4. Asignar Roles Específicos
-- Doctor
INSERT INTO public.doctores (
        id_persona,
        id_especialidad_medica,
        matricula_profesional
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1000001'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        LIMIT 1
    ), 'MAT-12345'
WHERE NOT EXISTS (
        SELECT 1
        FROM doctores
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1000001'
            )
    );
-- Estudiante
INSERT INTO public.estudiantes (
        id_persona,
        registro_universitario,
        carrera,
        facultad,
        activo
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1000002'
    ),
    'REG-12345',
    'Informática',
    'Ciencias Puras',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM estudiantes
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1000002'
            )
    );
-- Administrativo
INSERT INTO public.administrativos (id_persona, numero_item, cargo, unidad)
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1000003'
    ),
    'ITEM-001',
    'Jefe de Sistemas',
    'TIC'
WHERE NOT EXISTS (
        SELECT 1
        FROM administrativos
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1000003'
            )
    );
-- Docente
INSERT INTO public.docentes (
        id_persona,
        numero_item,
        facultad,
        interino_contratado
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1000004'
    ),
    'ITEM-DOC-01',
    'Medicina',
    'Interino'
WHERE NOT EXISTS (
        SELECT 1
        FROM docentes
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1000004'
            )
    );
-- Consultor
INSERT INTO public.consultores (id_persona)
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1000005'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM consultores
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1000005'
            )
    );

-- 5. Posta, consultorio y asignación activa de test.doctor
INSERT INTO public.roles (nombre)
SELECT 'DOCTOR'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.roles
        WHERE nombre = 'DOCTOR'
    );

INSERT INTO public.asignacion_roles (id_persona, id_rol, fecha_asignacion, activo)
SELECT p.id_persona,
    r.id_rol,
    CURRENT_DATE,
    true
FROM public.personas p
    JOIN public.roles r ON r.nombre = 'DOCTOR'
WHERE p.ci = '1000001'
    AND NOT EXISTS (
        SELECT 1
        FROM public.asignacion_roles ar
        WHERE ar.id_persona = p.id_persona
            AND ar.id_rol = r.id_rol
    );

INSERT INTO public.postas_medicas (nombre, codigo, direccion, activo)
SELECT 'Posta de prueba',
    'POSTA-TEST-DOCTOR',
    'Campus UMSA',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.postas_medicas
        WHERE codigo = 'POSTA-TEST-DOCTOR'
    );

INSERT INTO public.consultorios_especialidad (
        fecha_habilitacion,
        numero_consultorio,
        piso_ubicacion,
        activo,
        id_posta,
        id_especialidad
    )
SELECT CURRENT_DATE,
    'CONS-TEST-DOCTOR',
    '1er Piso',
    true,
    (
        SELECT id_posta
        FROM public.postas_medicas
        WHERE codigo = 'POSTA-TEST-DOCTOR'
    ),
    d.id_especialidad_medica
FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
WHERE p.ci = '1000001'
    AND d.id_especialidad_medica IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.consultorios_especialidad
        WHERE numero_consultorio = 'CONS-TEST-DOCTOR'
    );

INSERT INTO public.asignacion_doctores_consultorio (
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        cupos_disponibles,
        activo,
        id_doctor,
        id_consultorio,
        id_especialidad
    )
SELECT 'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES',
    'Mañana',
    '08:00:00',
    '18:00:00',
    20,
    10,
    true,
    d.id_doctor,
    c.id_consultorio,
    d.id_especialidad_medica
FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    JOIN public.consultorios_especialidad c ON c.numero_consultorio = 'CONS-TEST-DOCTOR'
WHERE p.ci = '1000001'
    AND NOT EXISTS (
        SELECT 1
        FROM public.asignacion_doctores_consultorio a
        WHERE a.id_doctor = d.id_doctor
            AND a.id_consultorio = c.id_consultorio
            AND a.activo = true
    );

-- Cita de hoy para que test.doctor pueda atender un paciente programado
INSERT INTO public.reservas_paciente (
        fecha_cita,
        hora_inicio_cita,
        hora_fin_cita,
        estado,
        observaciones,
        id_usuario,
        id_especialidad,
        id_posta,
        id_doctor
    )
SELECT CURRENT_DATE,
    '08:00:00',
    '18:00:00',
    'PENDIENTE',
    'Cita de prueba para test.doctor',
    u.id_usuario,
    d.id_especialidad_medica,
    pm.id_posta,
    d.id_doctor
FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    JOIN public.usuarios u ON u.username = 'test.estudiante'
    JOIN public.postas_medicas pm ON pm.codigo = 'POSTA-TEST-DOCTOR'
WHERE p.ci = '1000001'
    AND NOT EXISTS (
        SELECT 1
        FROM public.reservas_paciente r
        WHERE r.id_doctor = d.id_doctor
            AND r.fecha_cita = CURRENT_DATE
            AND r.hora_inicio_cita = '08:00:00'
    );
COMMIT;