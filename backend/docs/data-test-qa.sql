-- =============================================================================
-- SCRIPT DE REINICIO TOTAL Y CARGA DE DATOS QA (SADC - POSTAS UMSA)
-- Este script borra todos los datos y carga un entorno completo de prueba.
-- Usuarios: henry.[rol].test / axel.[rol].test
-- Roles disponibles: superadmin, estudiante, docente, administrativo, consultor, medicina, odontologia, psicologia
-- Ej. henry.superadmin.test / axel.administrativo.test
-- Contraseña global: password123
-- =============================================================================
BEGIN;
-- 1. LIMPIEZA TOTAL (REINICIO DESDE CERO)
-- Truncamos todas las tablas y reiniciamos los contadores SERIAL
TRUNCATE TABLE public.pagos,
public.consultas_medicas,
public.reservas_paciente,
public.asignacion_doctores_consultorio,
public.consultorios_especialidad,
public.doctores,
public.especialidades_medicas,
public.postas_medicas,
public.usuarios,
public.historial_usuarios,
public.roles,
public.estudiantes,
public.docentes,
public.administrativos,
public.contratos_consultores,
public.consultores,
public.personas,
public.fecha_cierre,
public.configuracion_reservas_consultas RESTART IDENTITY CASCADE;
-- 2. CATÁLOGOS BASE
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto
    )
VALUES (
        'Medicina General',
        'MED-SQA',
        'Atención primaria y preventiva',
        20
    ),
    (
        'Odontología',
        'ODO-SQA',
        'Salud bucal y dental',
        30
    ),
    (
        'Psicología',
        'PSI-SQA',
        'Salud mental y apoyo emocional',
        45
    ),
    (
        'Enfermería',
        'ENF-SQA',
        'Cuidados preventivos y curaciones',
        15
    ),
    (
        'Fisioterapia y Kinesiología',
        'FIS-SQA',
        'Rehabilitación física',
        40
    ),
    (
        'Ginecología y Obstetricia',
        'GIN-SQA',
        'Salud reproductiva femenina',
        25
    );
INSERT INTO public.postas_medicas (nombre, codigo, direccion, activo)
VALUES (
        'Posta Central UMSA',
        'PST-CEN',
        'Av. Villazón Nro 1999',
        true
    ),
    (
        'Posta de Tecnología',
        'PST-TEC',
        'Campus Universitario Cota Cota',
        true
    );
-- 3. CONFIGURACIÓN GLOBAL
INSERT INTO public.configuracion_reservas_consultas (
        dias_semana,
        hora_inicio_reserva,
        hora_fin_reserva,
        dias_anticipacion_minima,
        dias_anticipacion_maxima
    )
VALUES (
        'Lunes a Viernes',
        '07:00:00'::TIME,
        '19:00:00'::TIME,
        1,
        7
    );
-- 4. PERSONAS (Henry y Axel para cada rol)
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        genero,
        email,
        activo,
        fecha_registro
    )
VALUES -- Henrys
    (
        'QA-H-ADM',
        'Henry',
        'Superadmin',
        'Test',
        'M',
        'henry.superadmin@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-EST',
        'Henry',
        'Estudiante',
        'Test',
        'M',
        'henry.est@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-DOC',
        'Henry',
        'Docente',
        'Test',
        'M',
        'henry.doc@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-NST',
        'Henry',
        'Administrativo',
        'Test',
        'M',
        'henry.adm@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-CON',
        'Henry',
        'Consultor',
        'Test',
        'M',
        'henry.con@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-MED',
        'Henry',
        'Medicina',
        'Test',
        'M',
        'henry.med@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-ODO',
        'Henry',
        'Odontología',
        'Test',
        'M',
        'henry.odo@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-PSI',
        'Henry',
        'Psicología',
        'Test',
        'M',
        'henry.psi@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-H-DIR',
        'Henry',
        'Director',
        'Test',
        'M',
        'henry.dir@test.com',
        true,
        CURRENT_DATE
    ),
    -- Axels
    (
        'QA-A-ADM',
        'Axel',
        'Superadmin',
        'Test',
        'M',
        'axel.superadmin@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-EST',
        'Axel',
        'Estudiante',
        'Test',
        'M',
        'axel.est@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-DOC',
        'Axel',
        'Docente',
        'Test',
        'M',
        'axel.doc@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-NST',
        'Axel',
        'Administrativo',
        'Test',
        'M',
        'axel.adm@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-CON',
        'Axel',
        'Consultor',
        'Test',
        'M',
        'axel.con@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-MED',
        'Axel',
        'Medicina',
        'Test',
        'M',
        'axel.med@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-ODO',
        'Axel',
        'Odontología',
        'Test',
        'M',
        'axel.odo@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-PSI',
        'Axel',
        'Psicología',
        'Test',
        'M',
        'axel.psi@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-A-DIR',
        'Axel',
        'Director',
        'Test',
        'M',
        'axel.dir@test.com',
        true,
        CURRENT_DATE
    );
-- 5. USUARIOS (Password: password123)
-- Hash: $2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y
INSERT INTO public.usuarios (username, password, id_persona, bloqueado)
SELECT 'henry.' || lower(replace(primer_apellido, 'í', 'i')) || '.test',
    '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
    id_persona,
    false
FROM public.personas
WHERE ci LIKE 'QA-H-%'
UNION ALL
SELECT 'axel.' || lower(replace(primer_apellido, 'í', 'i')) || '.test',
    '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
    id_persona,
    false
FROM public.personas
WHERE ci LIKE 'QA-A-%';
-- 6. ASIGNACIÓN DE ROLES
INSERT INTO public.roles (tipo_rol, id_persona, fecha_asignacion, activo)
SELECT 'SuperUsuario',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-ADM'
UNION ALL
SELECT 'Estudiante',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-EST'
UNION ALL
SELECT 'Docente',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-DOC'
UNION ALL
SELECT 'Administrativo',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-NST'
UNION ALL
SELECT 'Consultor',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-CON'
UNION ALL
SELECT 'Director',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-DIR'
UNION ALL
SELECT 'Doctor',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci IN (
        SELECT ci
        FROM public.personas
        WHERE ci LIKE '%-MED'
            OR ci LIKE '%-ODO'
            OR ci LIKE '%-PSI'
    );
-- 7. PERFILES (Llenado de tablas específicas)
INSERT INTO public.estudiantes (
        id_persona,
        registro_universitario,
        carrera,
        facultad
    )
SELECT id_persona,
    'RU-' || ci,
    'Ingeniería de Sistemas',
    'Facultad de Tecnología'
FROM public.personas
WHERE ci LIKE '%-EST';
INSERT INTO public.docentes (
        id_persona,
        numero_item,
        facultad,
        interino_contratado
    )
SELECT id_persona,
    'ITM-' || ci,
    'C. Puras',
    'Titular'
FROM public.personas
WHERE ci LIKE '%-DOC';
INSERT INTO public.administrativos (id_persona, numero_item, cargo, unidad)
SELECT id_persona,
    'ADM-' || ci,
    'Analista de Sistemas',
    'Dirección Administrativa'
FROM public.personas
WHERE ci LIKE '%-NST';
INSERT INTO public.consultores (id_persona)
SELECT id_persona
FROM public.personas
WHERE ci LIKE '%-CON';
INSERT INTO public.doctores (
        id_persona,
        matricula_profesional,
        experiencia_profesional,
        id_especialidad_medica,
        universidad_origen,
        titulo_profesional,
        telefono_emergencia
    )
SELECT p.id_persona,
    'MAT-' || p.ci,
    '10 años de experiencia',
    em.id_especialidad_medica,
    'Universidad Mayor de San Andrés',
    'Médico Cirujano',
    '71234567'
FROM public.personas p,
    public.especialidades_medicas em
WHERE (
        p.ci LIKE '%-MED'
        AND em.nombre = 'Medicina General'
    )
    OR (
        p.ci LIKE '%-ODO'
        AND em.nombre = 'Odontología'
    )
    OR (
        p.ci LIKE '%-PSI'
        AND em.nombre = 'Psicología'
    );
-- 8. CONSULTORIOS Y ASIGNACIONES
INSERT INTO public.consultorios_especialidad (
        numero_consultorio,
        piso_ubicacion,
        id_posta,
        id_especialidad
    )
SELECT substr('C-' || em.nombre, 1, 20),
    '1er Piso',
    (
        SELECT id_posta
        FROM public.postas_medicas
        LIMIT 1
    ), em.id_especialidad_medica
FROM public.especialidades_medicas em
WHERE em.nombre IN ('Medicina General', 'Odontología', 'Psicología');
INSERT INTO public.asignacion_doctores_consultorio (
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        cupos_disponibles,
        id_doctor,
        id_consultorio,
        id_especialidad
    )
SELECT 'L-Mi-V',
    'Mañana',
    '08:00:00'::TIME,
    '12:00:00'::TIME,
    15,
    16,
    d.id_doctor,
    ce.id_consultorio,
    ce.id_especialidad
FROM public.doctores d
    INNER JOIN public.consultorios_especialidad ce ON d.id_especialidad_medica = ce.id_especialidad
    INNER JOIN public.personas p ON d.id_persona = p.id_persona
WHERE p.ci LIKE 'QA-H-%';
-- 9. TRANSACCIONES (Reservas, Consultas, Pagos)
INSERT INTO public.reservas_paciente (
        fecha_cita,
        hora_inicio_cita,
        hora_fin_cita,
        estado,
        id_usuario,
        id_especialidad,
        id_posta
    )
SELECT CURRENT_DATE + 1,
    '09:00:00'::TIME,
    '09:20:00'::TIME,
    'PENDIENTE',
    (
        SELECT id_usuario
        FROM public.usuarios
        WHERE username = 'henry.estudiante.test'
    ),
    (
        SELECT id_especialidad_medica
        FROM public.especialidades_medicas
        WHERE nombre = 'Medicina General'
    ),
    (
        SELECT id_posta
        FROM public.postas_medicas
        LIMIT 1
    );
-- Insertamos una consulta finalizada para probar el flujo de pagos
WITH nueva_reserva AS (
    INSERT INTO public.reservas_paciente (
            fecha_cita,
            hora_inicio_cita,
            hora_fin_cita,
            estado,
            id_usuario,
            id_especialidad,
            id_posta
        )
    VALUES (
            CURRENT_DATE - 1,
            '10:00:00'::TIME,
            '10:20:00'::TIME,
            'ATENDIDO',
            (
                SELECT id_usuario
                FROM public.usuarios
                WHERE username = 'axel.estudiante.test'
            ),
            (
                SELECT id_especialidad_medica
                FROM public.especialidades_medicas
                WHERE nombre = 'Medicina General'
            ),
            (
                SELECT id_posta
                FROM public.postas_medicas
                LIMIT 1
            )
        )
    RETURNING id_reserva_paciente
),
nueva_consulta AS (
    INSERT INTO public.consultas_medicas (
            peso_kl,
            estatura_cm,
            presion_arterial,
            temperatura,
            frecuencia_cardiaca,
            motivo_consulta,
            sintomas,
            id_reserva_paciente,
            id_doctor
        )
    SELECT 75.5,
        170.0,
        '120/80',
        36.5,
        72,
        'Control rutinario',
        'Ninguno',
        id_reserva_paciente,
        (
            SELECT id_doctor
            FROM public.doctores d
                INNER JOIN public.personas p ON d.id_persona = p.id_persona
            WHERE p.ci = 'QA-H-MED'
        )
    FROM nueva_reserva
    RETURNING id_consulta_medica
)
INSERT INTO public.pagos (
        monto,
        metodo_pago,
        id_consulta_medica,
        id_usuario_registro_pago
    )
SELECT 50.00,
    'Efectivo',
    id_consulta_medica,
    (
        SELECT id_usuario
        FROM public.usuarios
        WHERE username = 'henry.admin.test'
    )
FROM nueva_consulta;
-- 10. HISTORIAL Y CIERRES
INSERT INTO public.historial_usuarios (id_persona, fecha_hora_acceso)
SELECT id_persona,
    NOW()
FROM public.personas
WHERE ci LIKE '%-ADM';
INSERT INTO public.fecha_cierre (fecha, descripcion)
VALUES (CURRENT_DATE + 30, 'Feriado Departamental');
COMMIT;
-- =============================================================================
-- 11. ASIGNACIÓN EXTRA DE DOCTORES (COMPLETAR TODOS LOS DOCTORES)
-- =============================================================================
BEGIN;
-- Asignación Turno Mañana (Completando a los doctores de Axel que no estaban en la 1ra parte)
INSERT INTO public.asignacion_doctores_consultorio (
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        cupos_disponibles,
        id_doctor,
        id_consultorio,
        id_especialidad
    )
SELECT 'L-Mi-V',
    'Mañana',
    '08:00:00'::TIME,
    '12:00:00'::TIME,
    15,
    16,
    d.id_doctor,
    ce.id_consultorio,
    ce.id_especialidad
FROM public.doctores d
    INNER JOIN public.consultorios_especialidad ce ON d.id_especialidad_medica = ce.id_especialidad
    INNER JOIN public.personas p ON d.id_persona = p.id_persona
WHERE p.ci LIKE 'QA-A-%';
-- Asignación Turno Tarde para TODOS los doctores
INSERT INTO public.asignacion_doctores_consultorio (
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        cupos_disponibles,
        id_doctor,
        id_consultorio,
        id_especialidad
    )
SELECT 'L-Mi-V',
    'Tarde',
    '14:00:00'::TIME,
    '18:00:00'::TIME,
    20,
    12,
    d.id_doctor,
    ce.id_consultorio,
    ce.id_especialidad
FROM public.doctores d
    INNER JOIN public.consultorios_especialidad ce ON d.id_especialidad_medica = ce.id_especialidad;
-- Asignación Turno Noche para TODOS los doctores
INSERT INTO public.asignacion_doctores_consultorio (
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        cupos_disponibles,
        id_doctor,
        id_consultorio,
        id_especialidad
    )
SELECT 'Ma-J',
    'Noche',
    '18:00:00'::TIME,
    '22:00:00'::TIME,
    15,
    16,
    d.id_doctor,
    ce.id_consultorio,
    ce.id_especialidad
FROM public.doctores d
    INNER JOIN public.consultorios_especialidad ce ON d.id_especialidad_medica = ce.id_especialidad;
COMMIT;