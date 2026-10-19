-- =============================================================================
-- SCRIPT DE RE INICIO TOTAL Y CARGA DE DATOS QA (SADC - POSTAS UMSA)
-- Cada rol / especialidad tiene una persona distinta con nombre único.
-- Contraseña global : password123
-- Hash bcrypt       : $2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y
-- ─────────────────────────────────────────────────────────────────────────────
-- GRUPO 1 (QA-C-*) – Hombres
--   QA-C-ADM  Carlos     Mamani    Quispe    → c.mamani.superusuario
--   QA-C-EST  Rodrigo    Torrez    Aliaga    → r.torrez.estudiante
--   QA-C-DOC  Fernando   Colque    Vargas    → f.colque.docente
--   QA-C-NST  Miguel     Zapata    Ramos     → m.zapata.administrativo
--   QA-C-CON  Andrés     Villca    Poma      → a.villca.consultor
--   QA-C-DIR  Ernesto    Huanca    Condori   → e.huanca.director
--   QA-C-MED  Javier     Quispe    Limachi   → j.quispe.medicina       (Medicina General)
--   QA-C-ODO  Pablo      Rojas     Chura     → p.rojas.odontologia     (Odontología)
--   QA-C-PSI  Diego      Calle     Morales   → d.calle.psicologia      (Psicología)
--   QA-C-ENF  Marco      Soria     Coaquira  → m.soria.enfermeria      (Enfermería)
--   QA-C-FIS  Raúl       Limachi   Choque    → r.limachi.fisioterapia  (Fisioterapia)
--   QA-C-GIN  Alejandro  Condori   Poma      → a.condori.ginecologia   (Ginecología)
-- ─────────────────────────────────────────────────────────────────────────────
-- GRUPO 2 (QA-L-*) – Mujeres
--   QA-L-ADM  Lucía      Flores    Condori   → l.flores.superusuario
--   QA-L-EST  Valeria    Choque    Mendoza   → v.choque.estudiante
--   QA-L-DOC  Patricia   Huanca    López     → p.huanca.docente
--   QA-L-NST  Gabriela   Soria     Vega      → g.soria.administrativo
--   QA-L-CON  Camila     Bejarano  Sejas     → c.bejarano.consultor
--   QA-L-DIR  Mónica     Gutiérrez Salinas   → m.gutierrez.director
--   QA-L-MED  Sandra     Nina      Apaza     → s.nina.medicina         (Medicina General)
--   QA-L-ODO  Rosa       Tola      Chambi    → r.tola.odontologia      (Odontología)
--   QA-L-PSI  Elena      Pinto     Arce      → e.pinto.psicologia      (Psicología)
--   QA-L-ENF  Carmen     Apaza     Vargas    → c.apaza.enfermeria      (Enfermería)
--   QA-L-FIS  Diana      Ramos     Huanca    → d.ramos.fisioterapia    (Fisioterapia)
--   QA-L-GIN  Isabel     Álvarez   Sejas     → i.alvarez.ginecologia   (Ginecología)
-- =============================================================================
BEGIN;
-- 1. LIMPIEZA TOTAL (REINICIO DESDE CERO)
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
-- 4. PERSONAS (una persona distinta por rol / especialidad)
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
VALUES -- ── GRUPO 1: Hombres (QA-C-*) ──────────────────────────────────────────
    -- Roles generales
    (
        'QA-C-ADM',
        'Carlos',
        'Mamani',
        'Quispe',
        'M',
        'c.mamani.superusuario@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-EST',
        'Rodrigo',
        'Torrez',
        'Aliaga',
        'M',
        'r.torrez.estudiante@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-DOC',
        'Fernando',
        'Colque',
        'Vargas',
        'M',
        'f.colque.docente@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-NST',
        'Miguel',
        'Zapata',
        'Ramos',
        'M',
        'm.zapata.administrativo@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-CON',
        'Andrés',
        'Villca',
        'Poma',
        'M',
        'a.villca.consultor@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-DIR',
        'Ernesto',
        'Huanca',
        'Condori',
        'M',
        'e.huanca.director@test.com',
        true,
        CURRENT_DATE
    ),
    -- Doctores especializados
    (
        'QA-C-MED',
        'Javier',
        'Quispe',
        'Limachi',
        'M',
        'j.quispe.medicina@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-ODO',
        'Pablo',
        'Rojas',
        'Chura',
        'M',
        'p.rojas.odontologia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-PSI',
        'Diego',
        'Calle',
        'Morales',
        'M',
        'd.calle.psicologia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-ENF',
        'Marco',
        'Soria',
        'Coaquira',
        'M',
        'm.soria.enfermeria@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-FIS',
        'Raúl',
        'Limachi',
        'Choque',
        'M',
        'r.limachi.fisioterapia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-C-GIN',
        'Alejandro',
        'Condori',
        'Poma',
        'M',
        'a.condori.ginecologia@test.com',
        true,
        CURRENT_DATE
    ),
    -- ── GRUPO 2: Mujeres (QA-L-*) ──────────────────────────────────────────
    -- Roles generales
    (
        'QA-L-ADM',
        'Lucía',
        'Flores',
        'Condori',
        'F',
        'l.flores.superusuario@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-EST',
        'Valeria',
        'Choque',
        'Mendoza',
        'F',
        'v.choque.estudiante@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-DOC',
        'Patricia',
        'Huanca',
        'López',
        'F',
        'p.huanca.docente@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-NST',
        'Gabriela',
        'Soria',
        'Vega',
        'F',
        'g.soria.administrativo@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-CON',
        'Camila',
        'Bejarano',
        'Sejas',
        'F',
        'c.bejarano.consultor@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-DIR',
        'Mónica',
        'Gutiérrez',
        'Salinas',
        'F',
        'm.gutierrez.director@test.com',
        true,
        CURRENT_DATE
    ),
    -- Doctoras especializadas
    (
        'QA-L-MED',
        'Sandra',
        'Nina',
        'Apaza',
        'F',
        's.nina.medicina@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-ODO',
        'Rosa',
        'Tola',
        'Chambi',
        'F',
        'r.tola.odontologia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-PSI',
        'Elena',
        'Pinto',
        'Arce',
        'F',
        'e.pinto.psicologia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-ENF',
        'Carmen',
        'Apaza',
        'Vargas',
        'F',
        'c.apaza.enfermeria@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-FIS',
        'Diana',
        'Ramos',
        'Huanca',
        'F',
        'd.ramos.fisioterapia@test.com',
        true,
        CURRENT_DATE
    ),
    (
        'QA-L-GIN',
        'Isabel',
        'Álvarez',
        'Sejas',
        'F',
        'i.alvarez.ginecologia@test.com',
        true,
        CURRENT_DATE
    );
-- 5. USUARIOS (Password: password123)
-- Hash: $2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y
INSERT INTO public.usuarios (username, password, id_persona, bloqueado)
VALUES -- ── Grupo 1 – Roles generales ───────────────────────────────────────────
    (
        'c.mamani.superusuario',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-ADM'
        ),
        false
    ),
    (
        'r.torrez.estudiante',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-EST'
        ),
        false
    ),
    (
        'f.colque.docente',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-DOC'
        ),
        false
    ),
    (
        'm.zapata.administrativo',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-NST'
        ),
        false
    ),
    (
        'a.villca.consultor',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-CON'
        ),
        false
    ),
    (
        'e.huanca.director',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-DIR'
        ),
        false
    ),
    -- ── Grupo 1 – Doctores ──────────────────────────────────────────────────
    (
        'j.quispe.medicina',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-MED'
        ),
        false
    ),
    (
        'p.rojas.odontologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-ODO'
        ),
        false
    ),
    (
        'd.calle.psicologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-PSI'
        ),
        false
    ),
    (
        'm.soria.enfermeria',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-ENF'
        ),
        false
    ),
    (
        'r.limachi.fisioterapia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-FIS'
        ),
        false
    ),
    (
        'a.condori.ginecologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-C-GIN'
        ),
        false
    ),
    -- ── Grupo 2 – Roles generales ───────────────────────────────────────────
    (
        'l.flores.superusuario',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-ADM'
        ),
        false
    ),
    (
        'v.choque.estudiante',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-EST'
        ),
        false
    ),
    (
        'p.huanca.docente',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-DOC'
        ),
        false
    ),
    (
        'g.soria.administrativo',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-NST'
        ),
        false
    ),
    (
        'c.bejarano.consultor',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-CON'
        ),
        false
    ),
    (
        'm.gutierrez.director',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-DIR'
        ),
        false
    ),
    -- ── Grupo 2 – Doctoras ──────────────────────────────────────────────────
    (
        's.nina.medicina',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-MED'
        ),
        false
    ),
    (
        'r.tola.odontologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-ODO'
        ),
        false
    ),
    (
        'e.pinto.psicologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-PSI'
        ),
        false
    ),
    (
        'c.apaza.enfermeria',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-ENF'
        ),
        false
    ),
    (
        'd.ramos.fisioterapia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-FIS'
        ),
        false
    ),
    (
        'i.alvarez.ginecologia',
        '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y',
        (
            SELECT id_persona
            FROM public.personas
            WHERE ci = 'QA-L-GIN'
        ),
        false
    );
-- 6. ASIGNACIÓN DE ROLES
INSERT INTO public.roles (tipo_rol, id_persona, fecha_asignacion, activo)
SELECT 'SUPERUSUARIO',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-ADM'
UNION ALL
SELECT 'ESTUDIANTE',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-EST'
UNION ALL
SELECT 'DOCENTE',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-DOC'
UNION ALL
SELECT 'ADMINISTRATIVO',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-NST'
UNION ALL
SELECT 'CONSULTOR',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-CON'
UNION ALL
SELECT 'DIRECTOR',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-DIR'
UNION ALL
-- Todos los doctores (6 especialidades × 2 grupos = 12 doctores)
SELECT 'DOCTOR',
    id_persona,
    CURRENT_DATE,
    true
FROM public.personas
WHERE ci LIKE '%-MED'
    OR ci LIKE '%-ODO'
    OR ci LIKE '%-PSI'
    OR ci LIKE '%-ENF'
    OR ci LIKE '%-FIS'
    OR ci LIKE '%-GIN';
-- 7. PERFILES
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
-- Doctores con título profesional específico por especialidad
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
    CASE
        WHEN p.ci LIKE '%-MED' THEN 'Médico/a Cirujano/a'
        WHEN p.ci LIKE '%-ODO' THEN 'Odontólogo/a'
        WHEN p.ci LIKE '%-PSI' THEN 'Psicólogo/a Clínico/a'
        WHEN p.ci LIKE '%-ENF' THEN 'Licenciado/a en Enfermería'
        WHEN p.ci LIKE '%-FIS' THEN 'Licenciado/a en Fisioterapia y Kinesiología'
        WHEN p.ci LIKE '%-GIN' THEN 'Médico/a Ginecólogo/a - Obstétrico/a'
    END,
    '71234567'
FROM public.personas p
    JOIN public.especialidades_medicas em ON (
        (
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
        )
        OR (
            p.ci LIKE '%-ENF'
            AND em.nombre = 'Enfermería'
        )
        OR (
            p.ci LIKE '%-FIS'
            AND em.nombre = 'Fisioterapia y Kinesiología'
        )
        OR (
            p.ci LIKE '%-GIN'
            AND em.nombre = 'Ginecología y Obstetricia'
        )
    );
-- 8. CONSULTORIOS (uno por cada especialidad, en la Posta Central)
INSERT INTO public.consultorios_especialidad (
        numero_consultorio,
        piso_ubicacion,
        id_posta,
        id_especialidad
    )
SELECT substr('C-' || em.nombre, 1, 20),
    CASE
        WHEN em.nombre IN ('Medicina General', 'Odontología', 'Psicología') THEN '1er Piso'
        WHEN em.nombre IN ('Enfermería', 'Fisioterapia y Kinesiología') THEN '2do Piso'
        WHEN em.nombre = 'Ginecología y Obstetricia' THEN '3er Piso'
    END,
    (
        SELECT id_posta
        FROM public.postas_medicas
        WHERE codigo = 'PST-CEN'
    ),
    em.id_especialidad_medica
FROM public.especialidades_medicas em;
-- 9. ASIGNACIONES DE DOCTORES A CONSULTORIOS
-- Turno Mañana – Grupo 1 (hombres)
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
WHERE p.ci LIKE 'QA-C-%';
-- 10. TRANSACCIONES (Reservas, Consultas, Pagos)
-- Reserva PENDIENTE: Rodrigo Torrez (estudiante) → Medicina General
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
        WHERE username = 'r.torrez.estudiante'
    ),
    (
        SELECT id_especialidad_medica
        FROM public.especialidades_medicas
        WHERE nombre = 'Medicina General'
    ),
    (
        SELECT id_posta
        FROM public.postas_medicas
        WHERE codigo = 'PST-CEN'
    );
-- Consulta ATENDIDA + pago: Valeria Choque (paciente) → Dr. Javier Quispe (Medicina)
-- Pago registrado por: Miguel Zapata (administrativo)
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
                WHERE username = 'v.choque.estudiante'
            ),
            (
                SELECT id_especialidad_medica
                FROM public.especialidades_medicas
                WHERE nombre = 'Medicina General'
            ),
            (
                SELECT id_posta
                FROM public.postas_medicas
                WHERE codigo = 'PST-CEN'
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
    SELECT 58.0,
        161.0,
        '110/70',
        36.6,
        72,
        'Control rutinario',
        'Ninguno',
        id_reserva_paciente,
        (
            SELECT id_doctor
            FROM public.doctores d
                INNER JOIN public.personas p ON d.id_persona = p.id_persona
            WHERE p.ci = 'QA-C-MED'
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
        WHERE username = 'm.zapata.administrativo'
    )
FROM nueva_consulta;
-- 11. HISTORIAL Y CIERRES
INSERT INTO public.historial_usuarios (id_persona, fecha_hora_acceso)
SELECT id_persona,
    NOW()
FROM public.personas
WHERE ci LIKE '%-ADM';
INSERT INTO public.fecha_cierre (fecha, descripcion)
VALUES (CURRENT_DATE + 30, 'Feriado Departamental');
COMMIT;
-- =============================================================================
-- 12. ASIGNACIÓN EXTRA DE DOCTORES – TURNOS TARDE Y NOCHE
-- =============================================================================
BEGIN;
-- Turno Mañana – Grupo 2 (mujeres)
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
WHERE p.ci LIKE 'QA-L-%';
-- Turno Tarde – TODOS los doctores (12 en total)
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
-- Turno Noche – TODOS los doctores (12 en total)
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