-- =============================================================================
-- SEED DE PRUEBA: MÓDULO DE NOTIFICACIONES DE CITAS
-- Proyecto: backendPostasUmsa / MedPortal+
-- =============================================================================
--
-- REQUISITOS PREVIOS:
--   1. Migraciones aplicadas (incluye tabla notificaciones):
--        npm run migration:run
--   2. PostgreSQL con base de datos del proyecto
--
-- EJECUCIÓN:
--   psql -h localhost -U postgres -d sadc_umsa -v ON_ERROR_STOP=1 \
--     -f docs/seed-notificaciones-citas.sql
--
-- CONTRASEÑA GLOBAL: password123
-- Hash bcrypt: $2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y
--
-- =============================================================================
-- USUARIOS PARA INGRESAR AL SISTEMA
-- =============================================================================
-- | Username                 | Password     | Rol al login   | Qué probar                          |
-- |--------------------------|--------------|----------------|-------------------------------------|
-- | notif.superusuario       | password123  | SUPERUSUARIO   | Campana, popup, acceso total        |
-- | notif.estudiante         | password123  | ESTUDIANTE     | Popup recordatorio 24h (pre-cargado)|
-- | notif.docente            | password123  | DOCENTE        | Popup recordatorio 1h (pre-cargado) |
-- | notif.administrativo     | password123  | ADMINISTRATIVO | Popup recordatorio del día          |
-- | notif.consultor          | password123  | CONSULTOR      | Sin popup (cita en +3 días)         |
-- | notif.director           | password123  | DIRECTOR       | Sin notificaciones de citas         |
-- | notif.doctor.medico      | password123  | DOCTOR         | Resumen diario + recordatorio 1h    |
-- | notif.doctor.odontologia | password123  | DOCTOR         | Citas del día (resumen agrupado)    |
--
-- PASOS DE PRUEBA MANUAL:
--   1. Login como notif.estudiante → popup "Recordatorio de cita" → Entendido
--   2. Login como notif.doctor.medico → popup resumen + recordatorio 1h
--   3. Campana en header muestra badge; marcar todas / marcar una
--   4. Logout y re-login: no deben repetirse popups ya leídos
--   5. Esperar ciclo scheduler (15 min) o reiniciar backend para recordatorios automáticos
--   6. Re-ejecutar este script: limpia y recrea datos NOTIF-* sin duplicar
--
-- CITAS PENDIENTE (fechas relativas a NOW() America/La_Paz):
--   R1: +24h  → CITA_RECORDATORIO_24H  (notif.estudiante)
--   R2: +1h   → CITA_RECORDATORIO_1H   (notif.docente + notif.doctor.medico)
--   R3: hoy PM → CITA_RECORDATORIO_DIA  (notif.administrativo)
--   R4: +3d   → sin recordatorio inmediato (notif.consultor)
--   R5/R6: hoy 09:00 / 11:00 → DOCTOR_RESUMEN_DIARIO (notif.doctor.medico)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) LIMPIEZA AISLADA (solo datos NOTIF-* / notif.*)
-- ---------------------------------------------------------------------------
DELETE FROM public.notificaciones
WHERE clave_dedup LIKE 'NOTIF:%'
   OR clave_dedup LIKE 'NOTIF-TMP-%'
   OR id_usuario IN (SELECT id_usuario FROM public.usuarios WHERE username LIKE 'notif.%')
   OR id_reserva_paciente IN (
        SELECT id_reserva_paciente FROM public.reservas_paciente
        WHERE observaciones LIKE 'NOTIF-SEED%'
      );

DELETE FROM public.consultas_medicas
WHERE id_reserva_paciente IN (
    SELECT id_reserva_paciente FROM public.reservas_paciente
    WHERE observaciones LIKE 'NOTIF-SEED%'
);

DELETE FROM public.reservas_paciente
WHERE observaciones LIKE 'NOTIF-SEED%';

DELETE FROM public.asignacion_doctores_consultorio
WHERE id_doctor IN (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci LIKE 'NOTIF-%'
);

DELETE FROM public.doctores
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.estudiantes
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.docentes
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.administrativos
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.consultores
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.asignacion_roles
WHERE id_persona IN (SELECT id_persona FROM public.personas WHERE ci LIKE 'NOTIF-%');

DELETE FROM public.usuarios
WHERE username LIKE 'notif.%';

DELETE FROM public.personas
WHERE ci LIKE 'NOTIF-%';

-- ---------------------------------------------------------------------------
-- 2) CATÁLOGOS MÍNIMOS (idempotentes)
-- ---------------------------------------------------------------------------
INSERT INTO public.especialidades_medicas (
    nombre, codigo, descripcion, tiempo_cita_por_defecto, visible, activo
)
SELECT 'Medicina General Notif', 'NOTIF-MED-GEN', 'Especialidad seed notificaciones', 20, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.especialidades_medicas WHERE codigo = 'NOTIF-MED-GEN');

INSERT INTO public.especialidades_medicas (
    nombre, codigo, descripcion, tiempo_cita_por_defecto, visible, activo
)
SELECT 'Odontología Notif', 'NOTIF-ODO-GEN', 'Especialidad seed notificaciones odontología', 30, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.especialidades_medicas WHERE codigo = 'NOTIF-ODO-GEN');

INSERT INTO public.postas_medicas (
    nombre, codigo, direccion, telefono,
    horario_atencion_manana_inicio, horario_atencion_manana_fin,
    horario_atencion_tarde_inicio, horario_atencion_tarde_fin, activo
)
SELECT 'Posta Notificaciones UMSA', 'NOTIF-PST-01', 'Av. Villazón s/n', '2440000',
    '08:00:00', '12:30:00', '14:30:00', '18:30:00', true
WHERE NOT EXISTS (SELECT 1 FROM public.postas_medicas WHERE codigo = 'NOTIF-PST-01');

INSERT INTO public.consultorios_especialidad (
    fecha_habilitacion, numero_consultorio, piso_ubicacion, activo, id_posta, id_especialidad
)
SELECT CURRENT_DATE, 'NOTIF-01', 'PB', true,
    (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'NOTIF-PST-01'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'NOTIF-MED-GEN')
WHERE NOT EXISTS (
    SELECT 1 FROM public.consultorios_especialidad ce
    JOIN public.postas_medicas pm ON pm.id_posta = ce.id_posta
    WHERE pm.codigo = 'NOTIF-PST-01'
      AND ce.numero_consultorio = 'NOTIF-01'
);

INSERT INTO public.configuracion_reservas_consultas (
    dias_semana, hora_inicio_reserva, hora_fin_reserva,
    dias_anticipacion_minima, dias_anticipacion_maxima
)
SELECT 'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO',
    '07:00:00', '20:00:00', 0, 30
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_reservas_consultas LIMIT 1);

INSERT INTO public.roles (nombre)
VALUES
    ('SUPERUSUARIO'),
    ('ESTUDIANTE'),
    ('DOCENTE'),
    ('ADMINISTRATIVO'),
    ('CONSULTOR'),
    ('DIRECTOR'),
    ('DOCTOR')
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) PERSONAS
-- ---------------------------------------------------------------------------
INSERT INTO public.personas (
    ci, nombres, primer_apellido, segundo_apellido, fecha_nacimiento,
    genero, celular, email, direccion, activo
)
VALUES
    ('NOTIF-SUP-001', 'Carlos', 'Super', 'Notif', '1985-01-10', 'M', '70001001', 'notif.super@umsa.bo', 'Centro', true),
    ('NOTIF-EST-001', 'Ana', 'Estudiante', 'Notif', '2002-03-15', 'F', '70001002', 'notif.estudiante@umsa.bo', 'Miraflores', true),
    ('NOTIF-DOC-001', 'Luis', 'Docente', 'Notif', '1988-06-20', 'M', '70001003', 'notif.docente@umsa.bo', 'San Pedro', true),
    ('NOTIF-ADM-001', 'María', 'Administrativa', 'Notif', '1990-09-05', 'F', '70001004', 'notif.admin@umsa.bo', 'Obrajes', true),
    ('NOTIF-CON-001', 'Pedro', 'Consultor', 'Notif', '1987-11-12', 'M', '70001005', 'notif.consultor@umsa.bo', 'Calacoto', true),
    ('NOTIF-DIR-001', 'Elena', 'Directora', 'Notif', '1975-04-08', 'F', '70001006', 'notif.director@umsa.bo', 'Achumani', true),
    ('NOTIF-DR-MED-001', 'Ricardo', 'Mendoza', 'Notif', '1979-07-22', 'M', '70001007', 'notif.dr.medico@umsa.bo', 'Tembladerani', true),
    ('NOTIF-DR-ODO-001', 'Patricia', 'Ríos', 'Notif', '1983-12-01', 'F', '70001008', 'notif.dr.odo@umsa.bo', 'Villa Fátima', true);

-- ---------------------------------------------------------------------------
-- 4) USUARIOS
-- ---------------------------------------------------------------------------
INSERT INTO public.usuarios (username, password, bloqueado, id_persona, is_book)
VALUES
    ('notif.superusuario', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-SUP-001'), false),
    ('notif.estudiante', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-EST-001'), true),
    ('notif.docente', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DOC-001'), true),
    ('notif.administrativo', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-ADM-001'), true),
    ('notif.consultor', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-CON-001'), true),
    ('notif.director', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DIR-001'), false),
    ('notif.doctor.medico', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DR-MED-001'), false),
    ('notif.doctor.odontologia', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false,
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DR-ODO-001'), false);

-- ---------------------------------------------------------------------------
-- 5) ASIGNACIÓN DE ROLES
-- ---------------------------------------------------------------------------
INSERT INTO public.asignacion_roles (id_persona, id_rol, fecha_asignacion, activo)
SELECT p.id_persona, r.id_rol, CURRENT_DATE, true
FROM public.personas p
JOIN public.roles r ON r.nombre = CASE p.ci
    WHEN 'NOTIF-SUP-001' THEN 'SUPERUSUARIO'
    WHEN 'NOTIF-EST-001' THEN 'ESTUDIANTE'
    WHEN 'NOTIF-DOC-001' THEN 'DOCENTE'
    WHEN 'NOTIF-ADM-001' THEN 'ADMINISTRATIVO'
    WHEN 'NOTIF-CON-001' THEN 'CONSULTOR'
    WHEN 'NOTIF-DIR-001' THEN 'DIRECTOR'
    WHEN 'NOTIF-DR-MED-001' THEN 'DOCTOR'
    WHEN 'NOTIF-DR-ODO-001' THEN 'DOCTOR'
END
WHERE p.ci LIKE 'NOTIF-%';

-- ---------------------------------------------------------------------------
-- 6) PERFILES ESPECÍFICOS
-- ---------------------------------------------------------------------------
INSERT INTO public.estudiantes (id_persona, registro_universitario, carrera, facultad, activo)
VALUES (
    (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-EST-001'),
    'RU-NOTIF-001', 'Medicina', 'Facultad de Medicina', true
);

INSERT INTO public.docentes (id_persona, numero_item, facultad, interino_contratado, activo)
VALUES (
    (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DOC-001'),
    'DOC-NOTIF-001', 'Facultad de Medicina', 'Titular', true
);

INSERT INTO public.administrativos (id_persona, numero_item, cargo, unidad)
VALUES (
    (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-ADM-001'),
    'ADM-NOTIF-001', 'Asistente administrativo', 'Posta Médica'
);

INSERT INTO public.consultores (id_persona)
VALUES ((SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-CON-001'));

INSERT INTO public.doctores (
    id_persona, id_especialidad_medica, matricula_profesional,
    experiencia_profesional, universidad_origen, titulo_profesional, telefono_emergencia
)
VALUES
    (
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DR-MED-001'),
        (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'NOTIF-MED-GEN'),
        'MAT-NOTIF-MED', '10 años', 'UMSA', 'Médico Cirujano', '71234001'
    ),
    (
        (SELECT id_persona FROM public.personas WHERE ci = 'NOTIF-DR-ODO-001'),
        (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'NOTIF-ODO-GEN'),
        'MAT-NOTIF-ODO', '8 años', 'UMSA', 'Odontóloga', '71234002'
    );

INSERT INTO public.asignacion_doctores_consultorio (
    dias_semana, turno, hora_inicio, hora_fin, duracion_cita,
    cupos_disponibles, activo, id_doctor, id_consultorio, id_especialidad
)
SELECT
    'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES',
    'MANANA', '07:00:00', '20:00:00', 20, 50, true,
    d.id_doctor,
    (SELECT id_consultorio FROM public.consultorios_especialidad ce
     JOIN public.postas_medicas pm ON pm.id_posta = ce.id_posta
     WHERE pm.codigo = 'NOTIF-PST-01' AND ce.numero_consultorio = 'NOTIF-01' LIMIT 1),
    d.id_especialidad_medica
FROM public.doctores d
JOIN public.personas p ON p.id_persona = d.id_persona
WHERE p.ci IN ('NOTIF-DR-MED-001', 'NOTIF-DR-ODO-001');

-- ---------------------------------------------------------------------------
-- 7) RESERVAS PENDIENTE (fechas relativas)
-- ---------------------------------------------------------------------------
WITH ts AS (
    SELECT
        (NOW() AT TIME ZONE 'America/La_Paz' + INTERVAL '24 hours') AS t24h,
        (NOW() AT TIME ZONE 'America/La_Paz' + INTERVAL '1 hour') AS t1h,
        (NOW() AT TIME ZONE 'America/La_Paz')::date AS today_lpz
)
INSERT INTO public.reservas_paciente (
    fecha_cita, hora_inicio_cita, hora_fin_cita, estado, observaciones,
    id_usuario, id_especialidad, id_posta, id_doctor
)
SELECT
    v.fecha_cita,
    v.hora_inicio,
    v.hora_fin,
    'PENDIENTE',
    v.observaciones,
    (SELECT id_usuario FROM public.usuarios WHERE username = v.username),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = v.codigo_esp),
    (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'NOTIF-PST-01'),
    (SELECT d.id_doctor FROM public.doctores d
     JOIN public.personas p ON p.id_persona = d.id_persona
     WHERE p.ci = v.ci_doctor)
FROM ts
CROSS JOIN LATERAL (VALUES
    (ts.t24h::date, ts.t24h::time, (ts.t24h + INTERVAL '20 minutes')::time,
     'NOTIF-SEED: R1 recordatorio 24h', 'notif.estudiante', 'NOTIF-MED-GEN', 'NOTIF-DR-MED-001'),
    (ts.t1h::date, ts.t1h::time, (ts.t1h + INTERVAL '20 minutes')::time,
     'NOTIF-SEED: R2 recordatorio 1h', 'notif.docente', 'NOTIF-MED-GEN', 'NOTIF-DR-MED-001'),
    (ts.today_lpz, '15:00:00'::time, '15:20:00'::time,
     'NOTIF-SEED: R3 recordatorio del día', 'notif.administrativo', 'NOTIF-MED-GEN', 'NOTIF-DR-MED-001'),
    (ts.today_lpz + 3, '10:30:00'::time, '11:00:00'::time,
     'NOTIF-SEED: R4 cita futura sin alerta', 'notif.consultor', 'NOTIF-ODO-GEN', 'NOTIF-DR-ODO-001'),
    (ts.today_lpz, '09:00:00'::time, '09:20:00'::time,
     'NOTIF-SEED: R5 resumen diario doctor', 'notif.estudiante', 'NOTIF-MED-GEN', 'NOTIF-DR-MED-001'),
    (ts.today_lpz, '11:00:00'::time, '11:20:00'::time,
     'NOTIF-SEED: R6 resumen diario doctor', 'notif.docente', 'NOTIF-MED-GEN', 'NOTIF-DR-MED-001')
) AS v(fecha_cita, hora_inicio, hora_fin, observaciones, username, codigo_esp, ci_doctor);

-- ---------------------------------------------------------------------------
-- 8) NOTIFICACIONES PRE-CARGADAS (popup inmediato al login)
-- ---------------------------------------------------------------------------
INSERT INTO public.notificaciones (
    tipo, titulo, mensaje, leida, metadata, clave_dedup,
    id_usuario, id_reserva_paciente, fecha_creacion
)
SELECT
    n.tipo,
    n.titulo,
    n.mensaje,
    false,
    n.metadata::jsonb,
    n.temp_clave,
    (SELECT id_usuario FROM public.usuarios WHERE username = n.username),
    (SELECT id_reserva_paciente FROM public.reservas_paciente WHERE observaciones = n.obs_reserva),
    NOW()
FROM (VALUES
    (
        'CITA_RECORDATORIO_24H',
        'Recordatorio de cita',
        'Tu cita con Dr. Ricardo Mendoza Notif es mañana a las 10:00 en Posta Notificaciones UMSA (Medicina General Notif).',
        '{"doctor":"Ricardo Mendoza Notif","especialidad":"Medicina General Notif","posta":"Posta Notificaciones UMSA","horaInicioCita":"10:00:00"}',
        'NOTIF-SEED: R1 recordatorio 24h',
        'notif.estudiante',
        'NOTIF-TMP-N1'
    ),
    (
        'CITA_RECORDATORIO_1H',
        'Tu cita comienza pronto',
        'Tu cita con Dr. Ricardo Mendoza Notif comienza en 1 hora (10:00) en Posta Notificaciones UMSA.',
        '{"doctor":"Ricardo Mendoza Notif","especialidad":"Medicina General Notif","posta":"Posta Notificaciones UMSA","horaInicioCita":"10:00:00"}',
        'NOTIF-SEED: R2 recordatorio 1h',
        'notif.docente',
        'NOTIF-TMP-N2'
    ),
    (
        'CITA_RECORDATORIO_1H',
        'Consulta en 1 hora',
        'Consulta con Luis Docente Notif en 1 hora (10:00) — Medicina General Notif.',
        '{"paciente":"Luis Docente Notif","doctor":"Ricardo Mendoza Notif","especialidad":"Medicina General Notif","posta":"Posta Notificaciones UMSA","horaInicioCita":"10:00:00"}',
        'NOTIF-SEED: R2 recordatorio 1h',
        'notif.doctor.medico',
        'NOTIF-TMP-N3'
    ),
    (
        'CITA_RECORDATORIO_DIA',
        'Cita programada para hoy',
        'Hoy tienes cita a las 15:00 con Dr. Ricardo Mendoza Notif (Medicina General Notif) en Posta Notificaciones UMSA.',
        '{"doctor":"Ricardo Mendoza Notif","especialidad":"Medicina General Notif","posta":"Posta Notificaciones UMSA","horaInicioCita":"15:00:00"}',
        'NOTIF-SEED: R3 recordatorio del día',
        'notif.administrativo',
        'NOTIF-TMP-N4'
    ),
    (
        'DOCTOR_RESUMEN_DIARIO',
        'Resumen de consultas del día',
        'Buenos días. Tienes 4 consultas programadas para hoy: 09:00 Ana Estudiante Notif (Medicina General Notif), 11:00 Luis Docente Notif (Medicina General Notif), y más.',
        '{"fecha":"' || TO_CHAR((NOW() AT TIME ZONE 'America/La_Paz')::date, 'YYYY-MM-DD') || '","totalCitas":4}',
        'NOTIF-SEED: R5 resumen diario doctor',
        'notif.doctor.medico',
        'NOTIF-TMP-N5'
    )
) AS n(tipo, titulo, mensaje, metadata, obs_reserva, username, temp_clave);

-- Actualizar clave_dedup con IDs reales (formato NOTIF: para limpieza)
UPDATE public.notificaciones n
SET clave_dedup = 'NOTIF:' || n.tipo || ':' || COALESCE(n.id_reserva_paciente::text, '0') || ':' || n.id_usuario::text
WHERE n.clave_dedup LIKE 'NOTIF-TMP-%'
  AND n.id_usuario IN (SELECT id_usuario FROM public.usuarios WHERE username LIKE 'notif.%');

-- Resumen diario usa clave con doctor y fecha
UPDATE public.notificaciones n
SET clave_dedup = 'NOTIF:DOCTOR_RESUMEN_DIARIO:' ||
    (SELECT d.id_doctor::text FROM public.doctores d
     JOIN public.personas p ON p.id_persona = d.id_persona
     WHERE p.ci = 'NOTIF-DR-MED-001') || ':' ||
    TO_CHAR((NOW() AT TIME ZONE 'America/La_Paz')::date, 'YYYY-MM-DD') || ':' ||
    n.id_usuario::text
WHERE n.tipo = 'DOCTOR_RESUMEN_DIARIO'
  AND n.id_usuario = (SELECT id_usuario FROM public.usuarios WHERE username = 'notif.doctor.medico');

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras COMMIT)
-- ---------------------------------------------------------------------------
-- SELECT u.username, r.nombre AS rol, COUNT(n.id_notificacion) AS notificaciones_no_leidas
-- FROM usuarios u
-- JOIN personas p ON p.id_persona = u.id_persona
-- JOIN asignacion_roles ar ON ar.id_persona = p.id_persona AND ar.activo = true
-- JOIN roles r ON r.id_rol = ar.id_rol
-- LEFT JOIN notificaciones n ON n.id_usuario = u.id_usuario AND n.leida = false
-- WHERE u.username LIKE 'notif.%'
-- GROUP BY u.username, r.nombre
-- ORDER BY u.username;
