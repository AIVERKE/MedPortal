-- ==========================================================
-- SCRIPT MAESTRO DE INSERCIÓN (PARA BASE DE DATOS VACÍA)
-- Ordenado jerárquicamente para no violar llaves foráneas (FK)
-- Contraseña para TODOS los usuarios: 123456
-- ==========================================================
-- ==========================================================
-- 1. CATÁLOGOS BASE (Especialidades y Postas)
-- ==========================================================
INSERT INTO public.especialidades_medicas (
    id_especialidad_medica,
    nombre,
    codigo,
    descripcion,
    tiempo_cita_por_defecto,
    visible,
    activo
  )
VALUES (
    1,
    'Enfermería',
    'ENF-01',
    'Triaje y signos vitales',
    15,
    true,
    true
  ),
  (
    2,
    'Medicina General',
    'MED-GEN',
    'Atención médica primaria',
    20,
    true,
    true
  ),
  (
    3,
    'Psicología',
    'PSI-CLI',
    'Evaluación y terapia',
    45,
    true,
    true
  ),
  (
    4,
    'Odontología',
    'ODO-BS',
    'Salud oral básica',
    30,
    true,
    true
  ),
  (
    5,
    'Fisioterapia y Kinesiología',
    'FIS-01',
    'Rehabilitación física',
    40,
    true,
    true
  ),
  (
    6,
    'Ginecología y Obstetricia',
    'GIN-01',
    'Salud de la mujer',
    30,
    true,
    true
  );
INSERT INTO public.postas_medicas (
    id_posta,
    nombre,
    codigo,
    direccion,
    telefono,
    horario_atencion_manana_inicio,
    horario_atencion_manana_fin,
    horario_atencion_tarde_inicio,
    horario_atencion_tarde_fin,
    activo
  )
VALUES (
    1,
    'Posta Central Monoblock',
    'PST-MONO',
    'Av. Villazón, Monoblock Central',
    '2440000',
    '08:30:00',
    '12:30:00',
    '14:30:00',
    '18:30:00',
    true
  ),
  (
    2,
    'Posta Campus Cota Cota',
    'PST-COTA',
    'Calle 27 Cota Cota',
    '2790000',
    '09:00:00',
    '13:00:00',
    '14:00:00',
    '18:00:00',
    true
  );
-- ==========================================================
-- 2. PERSONAS (Originales + Nuevas)
-- ==========================================================
INSERT INTO public.personas (
    id_persona,
    ci,
    nombres,
    primer_apellido,
    segundo_apellido,
    fecha_nacimiento,
    genero,
    celular,
    email,
    direccion,
    fecha_registro,
    activo
  )
VALUES -- Originales del Dump
  (
    1,
    '0000000',
    'Admin',
    'Principal',
    NULL,
    NULL,
    NULL,
    NULL,
    'admin@sadc.com',
    NULL,
    '2026-02-24',
    true
  ),
  (
    2,
    '1111111 LP',
    'Dr. Ricardo',
    'Vargas',
    'Mendoza',
    '1975-05-20',
    'M',
    '77700001',
    'ricardo.vargas@med.bo',
    NULL,
    '2026-02-24',
    true
  ),
  (
    3,
    '2222222 LP',
    'Dra. Elena',
    'Paredes',
    NULL,
    '1982-10-15',
    'F',
    '77700002',
    'elena.paredes@med.bo',
    NULL,
    '2026-02-24',
    true
  ),
  (
    4,
    '3333333 LP',
    'Lic. Pedro',
    'Mamani',
    'Quispe',
    '1990-03-05',
    'M',
    '77700003',
    'pedro.mamani@enf.bo',
    NULL,
    '2026-02-24',
    true
  ),
  (
    5,
    '9876543 LP',
    'Carlos',
    'Estudiante',
    'Ejemplo',
    '2003-01-20',
    'M',
    '70000001',
    'carlos.estudiante@umsa.bo',
    NULL,
    '2026-02-24',
    true
  ),
  -- Nuevas Generadas
  (
    10,
    '4444444 LP',
    'Lucia',
    'Fernandez',
    'Gomez',
    '2001-08-12',
    'F',
    '71110001',
    'lucia.fernandez@umsa.bo',
    'Zona Sur, Calle 1',
    '2026-02-24',
    true
  ),
  (
    11,
    '5555555 LP',
    'Marcos',
    'Choque',
    'Tarqui',
    '1980-11-25',
    'M',
    '72220002',
    'marcos.choque@umsa.bo',
    'El Alto, Cruce Viacha',
    '2026-02-24',
    true
  ),
  (
    12,
    '6666666 LP',
    'Sofia',
    'Rios',
    'Blanco',
    '1995-02-10',
    'F',
    '73330003',
    'sofia.rios@umsa.bo',
    'Sopocachi, Av. Ecuador',
    '2026-02-24',
    true
  ),
  (
    13,
    '7777777 LP',
    'Dr. Roberto',
    'Gomez',
    'Bolaños',
    '1980-04-12',
    'M',
    '74440004',
    'roberto.gomez@odo.bo',
    'Zona Sur, Calacoto',
    '2026-02-24',
    true
  ),
  (
    14,
    '8888888 LP',
    'Dra. Ana',
    'Martinez',
    'Suarez',
    '1985-09-25',
    'F',
    '75550005',
    'ana.martinez@med.bo',
    'Obrajes, Calle 10',
    '2026-02-24',
    true
  ),
  (
    15,
    '9999999 LP',
    'Lic. Carmen',
    'Rosa',
    'Paz',
    '1990-11-05',
    'F',
    '76660006',
    'carmen.paz@psi.bo',
    'Miraflores, Av. Saavedra',
    '2026-02-24',
    true
  ),
  (
    16,
    '1600016 LP',
    'Laura',
    'Mamani',
    'Condori',
    '1992-05-10',
    'F',
    '71000016',
    'laura.mamani@enf.bo',
    'El Alto, Senkata',
    '2026-02-24',
    true
  ),
  (
    17,
    '1700017 LP',
    'Jorge',
    'Quispe',
    'Apaza',
    '1988-11-22',
    'M',
    '71000017',
    'jorge.quispe@enf.bo',
    'Miraflores, La Paz',
    '2026-02-24',
    true
  ),
  (
    18,
    '1800018 LP',
    'Silvia',
    'Choque',
    'Ticona',
    '1995-03-14',
    'F',
    '71000018',
    'silvia.choque@enf.bo',
    'Zona Sur, Obrajes',
    '2026-02-24',
    true
  ),
  (
    19,
    '1900019 LP',
    'Dr. Carlos',
    'Villaroel',
    'Mendez',
    '1982-07-30',
    'M',
    '71000019',
    'carlos.villaroel@med.bo',
    'Sopocachi',
    '2026-02-24',
    true
  ),
  (
    20,
    '2000020 LP',
    'Dra. Patricia',
    'Rojas',
    'Salazar',
    '1985-09-18',
    'F',
    '71000020',
    'patricia.rojas@med.bo',
    'San Pedro',
    '2026-02-24',
    true
  ),
  (
    21,
    '2100021 LP',
    'Dr. Fernando',
    'Alvarez',
    'Torres',
    '1979-12-05',
    'M',
    '71000021',
    'fernando.alvarez@med.bo',
    'Calacoto',
    '2026-02-24',
    true
  ),
  (
    22,
    '2200022 LP',
    'Lic. Andrea',
    'Guzman',
    'Velasco',
    '1990-01-25',
    'F',
    '71000022',
    'andrea.guzman@psi.bo',
    'Achumani',
    '2026-02-24',
    true
  ),
  (
    23,
    '2300023 LP',
    'Lic. Martin',
    'Soria',
    'Campos',
    '1987-04-11',
    'M',
    '71000023',
    'martin.soria@psi.bo',
    'Centro, Illimani',
    '2026-02-24',
    true
  ),
  (
    24,
    '2400024 LP',
    'Lic. Valeria',
    'Ortiz',
    'Navarro',
    '1993-08-09',
    'F',
    '71000024',
    'valeria.ortiz@psi.bo',
    'Bolognia',
    '2026-02-24',
    true
  ),
  (
    25,
    '2500025 LP',
    'Dr. Luis',
    'Paredes',
    'Gomez',
    '1986-10-12',
    'M',
    '71000025',
    'luis.paredes@odo.bo',
    'Villa Fátima',
    '2026-02-24',
    true
  ),
  (
    26,
    '2600026 LP',
    'Dra. Gabriela',
    'Vargas',
    'Pinto',
    '1989-02-28',
    'F',
    '71000026',
    'gabriela.vargas@odo.bo',
    'Cotahuma',
    '2026-02-24',
    true
  ),
  (
    27,
    '2700027 LP',
    'Dr. Diego',
    'Morales',
    'Rios',
    '1991-06-17',
    'M',
    '71000027',
    'diego.morales@odo.bo',
    'Irpavi',
    '2026-02-24',
    true
  ),
  (
    28,
    '2800028 LP',
    'Lic. Marcelo',
    'Camacho',
    'Vera',
    '1988-03-15',
    'M',
    '71000028',
    'marcelo.camacho@fisio.bo',
    'Miraflores',
    '2026-02-24',
    true
  ),
  (
    29,
    '2900029 LP',
    'Lic. Daniela',
    'Soto',
    'Miranda',
    '1992-07-22',
    'F',
    '71000029',
    'daniela.soto@fisio.bo',
    'Sopocachi',
    '2026-02-24',
    true
  ),
  (
    30,
    '3000030 LP',
    'Lic. Hugo',
    'Cordero',
    'Tapia',
    '1985-11-09',
    'M',
    '71000030',
    'hugo.cordero@fisio.bo',
    'Obrajes',
    '2026-02-24',
    true
  ),
  (
    31,
    '3100031 LP',
    'Dra. Claudia',
    'Mendoza',
    'Arce',
    '1980-01-30',
    'F',
    '71000031',
    'claudia.mendoza@gine.bo',
    'Calacoto',
    '2026-02-24',
    true
  ),
  (
    32,
    '3200032 LP',
    'Dra. Beatriz',
    'Rivas',
    'Salinas',
    '1984-05-18',
    'F',
    '71000032',
    'beatriz.rivas@gine.bo',
    'San Pedro',
    '2026-02-24',
    true
  ),
  (
    33,
    '3300033 LP',
    'Dr. Roberto',
    'Peña',
    'Guzman',
    '1978-09-05',
    'M',
    '71000033',
    'roberto.pena@gine.bo',
    'Achumani',
    '2026-02-24',
    true
  );
-- ==========================================================
-- 3. USUARIOS (Hash de '123456' para todos)
-- ==========================================================
INSERT INTO public.usuarios (
    id_usuario,
    username,
    password,
    bloqueado,
    is_book,
    fecha_creacion,
    id_persona
  )
VALUES (
    1,
    'admin',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    1
  ),
  (
    2,
    'dr.vargas',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    2
  ),
  (
    3,
    'dra.paredes',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    3
  ),
  (
    4,
    'paciente.carlos',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    5
  ),
  (
    10,
    'estudiante.lucia',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    10
  ),
  (
    11,
    'docente.marcos',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    11
  ),
  (
    12,
    'admin.sofia',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    12
  ),
  (
    13,
    'dr.gomez',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    13
  ),
  (
    14,
    'dra.martinez',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    14
  ),
  (
    15,
    'lic.rosa',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    15
  ),
  (
    16,
    'enf.laura',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    16
  ),
  (
    17,
    'enf.jorge',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    17
  ),
  (
    18,
    'enf.silvia',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    18
  ),
  (
    19,
    'dr.carlos',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    19
  ),
  (
    20,
    'dra.patricia',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    20
  ),
  (
    21,
    'dr.fernando',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    21
  ),
  (
    22,
    'lic.andrea',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    22
  ),
  (
    23,
    'lic.martin',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    23
  ),
  (
    24,
    'lic.valeria',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    24
  ),
  (
    25,
    'dr.luis',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    25
  ),
  (
    26,
    'dra.gabriela',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    26
  ),
  (
    27,
    'dr.diego',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    27
  ),
  (
    28,
    'lic.marcelo',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    28
  ),
  (
    29,
    'lic.daniela',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    29
  ),
  (
    30,
    'lic.hugo',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    30
  ),
  (
    31,
    'dra.claudia',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    31
  ),
  (
    32,
    'dra.beatriz',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    32
  ),
  (
    33,
    'dr.roberto',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    false,
    false,
    NOW(),
    33
  );
-- ==========================================================
-- 4. ROLES
-- ==========================================================
INSERT INTO public.roles (
    id_rol,
    tipo_rol,
    fecha_asignacion,
    activo,
    id_persona
  )
VALUES (1, 'Administrador', '2026-02-24', true, 1),
  (2, 'Estudiante', '2026-02-24', true, 10),
  (3, 'Docente', '2026-02-24', true, 11),
  (4, 'Administrativo', '2026-02-24', true, 12),
  (5, 'Doctor', '2026-02-24', true, 13),
  (6, 'Doctor', '2026-02-24', true, 14),
  (7, 'Doctor', '2026-02-24', true, 15),
  (8, 'Personal Medico', '2026-02-24', true, 16),
  (9, 'Personal Medico', '2026-02-24', true, 17),
  (10, 'Personal Medico', '2026-02-24', true, 18),
  (11, 'Doctor', '2026-02-24', true, 19),
  (12, 'Doctor', '2026-02-24', true, 20),
  (13, 'Doctor', '2026-02-24', true, 21),
  (14, 'Doctor', '2026-02-24', true, 22),
  (15, 'Doctor', '2026-02-24', true, 23),
  (16, 'Doctor', '2026-02-24', true, 24),
  (17, 'Doctor', '2026-02-24', true, 25),
  (18, 'Doctor', '2026-02-24', true, 26),
  (19, 'Doctor', '2026-02-24', true, 27),
  (20, 'Doctor', '2026-02-24', true, 28),
  (21, 'Doctor', '2026-02-24', true, 29),
  (22, 'Doctor', '2026-02-24', true, 30),
  (23, 'Doctor', '2026-02-24', true, 31),
  (24, 'Doctor', '2026-02-24', true, 32),
  (25, 'Doctor', '2026-02-24', true, 33);
-- ==========================================================
-- 5. PERFILES (Estudiantes, Docentes, Admin, Doctores)
-- ==========================================================
INSERT INTO public.estudiantes (
    id_estudiante,
    registro_universitario,
    carrera,
    facultad,
    fecha_sincronizacion,
    estado_academico,
    activo,
    id_persona
  )
VALUES (
    2,
    'RU-20210543',
    'Ingeniería de Sistemas',
    'Ingeniería',
    NOW(),
    'Regular',
    true,
    10
  );
INSERT INTO public.docentes (
    id_docente,
    numero_item,
    facultad,
    fecha_sincronizacion,
    interino_contratado,
    activo,
    id_persona
  )
VALUES (
    2,
    'ITEM-8899',
    'Ciencias Puras y Naturales',
    NOW(),
    'Contratado',
    true,
    11
  );
INSERT INTO public.administrativos (
    id_administrativo,
    numero_item,
    unidad,
    cargo,
    fecha_sincronizacion,
    estado_laboral,
    id_persona
  )
VALUES (
    2,
    'ADM-4455',
    'Recursos Humanos',
    'Analista de Personal',
    NOW(),
    'Activo',
    12
  );
INSERT INTO public.doctores (
    id_doctor,
    matricula_profesional,
    experiencia_profesional,
    universidad_origen,
    titulo_profesional,
    telefono_emergencia,
    id_persona,
    id_especialidad_medica
  )
VALUES (
    1,
    'MED-12345',
    '15 años en medicina interna',
    NULL,
    NULL,
    NULL,
    2,
    2
  ),
  (
    2,
    'PSI-67890',
    '10 años en psicología clínica',
    NULL,
    NULL,
    NULL,
    3,
    3
  ),
  (
    3,
    'ENF-11111',
    '8 años en emergencias',
    NULL,
    NULL,
    NULL,
    4,
    1
  ),
  (
    4,
    'ODO-1010',
    '10 años en ortodoncia',
    'UMSA',
    'Odontólogo',
    '70001111',
    13,
    4
  ),
  (
    5,
    'MED-2020',
    '8 años en medicina familiar',
    'UPEA',
    'Médico Cirujano',
    '70002222',
    14,
    2
  ),
  (
    6,
    'PSI-3030',
    '5 años en terapia cognitiva',
    'UMSA',
    'Psicóloga Clínica',
    '70003333',
    15,
    3
  ),
  (
    7,
    'ENF-1011',
    '5 años en triaje',
    'UMSA',
    'Lic. en Enfermería',
    '79900001',
    16,
    1
  ),
  (
    8,
    'ENF-1012',
    '7 años en urgencias',
    'UPEA',
    'Lic. en Enfermería',
    '79900002',
    17,
    1
  ),
  (
    9,
    'ENF-1013',
    '2 años en asistencia',
    'UMSA',
    'Lic. en Enfermería',
    '79900003',
    18,
    1
  ),
  (
    10,
    'MED-2021',
    '12 años medicina familiar',
    'UMSA',
    'Médico Cirujano',
    '79900004',
    19,
    2
  ),
  (
    11,
    'MED-2022',
    '10 años en salud pública',
    'UPEA',
    'Médico Cirujano',
    '79900005',
    20,
    2
  ),
  (
    12,
    'MED-2023',
    '15 años en consulta externa',
    'UMSA',
    'Médico Cirujano',
    '79900006',
    21,
    2
  ),
  (
    13,
    'PSI-3031',
    '8 años terapia sistémica',
    'UMSA',
    'Psicóloga Clínica',
    '79900007',
    22,
    3
  ),
  (
    14,
    'PSI-3032',
    '6 años psicología educativa',
    'UPEA',
    'Psicólogo',
    '79900008',
    23,
    3
  ),
  (
    15,
    'PSI-3033',
    '4 años intervención',
    'UMSA',
    'Psicóloga',
    '79900009',
    24,
    3
  ),
  (
    16,
    'ODO-4041',
    '9 años en endodoncia',
    'UMSA',
    'Odontólogo',
    '79900010',
    25,
    4
  ),
  (
    17,
    'ODO-4042',
    '11 años odontopediatría',
    'UMSA',
    'Odontóloga',
    '79900011',
    26,
    4
  ),
  (
    18,
    'ODO-4043',
    '5 años en periodoncia',
    'UPEA',
    'Odontólogo',
    '79900012',
    27,
    4
  ),
  (
    19,
    'FIS-5051',
    '8 años rehabilitación deportiva',
    'UMSA',
    'Lic. en Fisioterapia',
    '79900013',
    28,
    5
  ),
  (
    20,
    'FIS-5052',
    '5 años terapia neurológica',
    'UPEA',
    'Lic. en Fisioterapia',
    '79900014',
    29,
    5
  ),
  (
    21,
    'FIS-5053',
    '10 años en traumatología',
    'UMSA',
    'Lic. en Fisioterapia',
    '79900015',
    30,
    5
  ),
  (
    22,
    'GIN-6061',
    '15 años en ginecología',
    'UMSA',
    'Médico Ginecólogo',
    '79900016',
    31,
    6
  ),
  (
    23,
    'GIN-6062',
    '10 años en obstetricia',
    'UMSA',
    'Médico Ginecólogo',
    '79900017',
    32,
    6
  ),
  (
    24,
    'GIN-6063',
    '18 años en fertilidad',
    'UPEA',
    'Médico Ginecólogo',
    '79900018',
    33,
    6
  );
-- ==========================================================
-- 6. CONSULTORIOS Y CONFIGURACIÓN
-- ==========================================================
INSERT INTO public.consultorios_especialidad (
    id_consultorio,
    fecha_habilitacion,
    numero_consultorio,
    piso_ubicacion,
    activo,
    id_posta,
    id_especialidad
  )
VALUES (1, '2026-02-24', 'T-01', 'PB', true, 1, 1),
  (2, '2026-02-24', 'M-01', 'PB', true, 1, 2),
  (3, '2026-02-24', 'ODO-01', 'Piso 1', true, 1, 4),
  (
    4,
    '2026-02-24',
    'PSI-02',
    'Planta Baja',
    true,
    2,
    3
  ),
  (
    5,
    '2026-02-24',
    'FISIO-01',
    'Planta Baja',
    true,
    1,
    5
  ),
  (6, '2026-02-24', 'GINE-01', 'Piso 2', true, 1, 6);
INSERT INTO public.configuracion_reservas_consultas (
    id_configuracion_reservas_medicas,
    dias_semana,
    hora_inicio_reserva,
    hora_fin_reserva,
    dias_anticipacion_minima,
    dias_anticipacion_maxima
  )
VALUES (
    1,
    'Lunes,Martes,Miércoles,Jueves,Viernes',
    '08:00:00',
    '18:00:00',
    1,
    15
  );
-- ==========================================================
-- 7. ASIGNACIÓN DE DOCTORES A CONSULTORIOS
-- ==========================================================
INSERT INTO public.asignacion_doctores_consultorio (
    id_asignacion_doctores_consultorio,
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
VALUES (
    1,
    'Lunes,Martes,Miércoles',
    'Mañana',
    '08:30:00',
    '12:30:00',
    20,
    NULL,
    true,
    1,
    2,
    2
  ),
  (
    2,
    'Jueves,Viernes',
    'Mañana',
    '08:30:00',
    '12:30:00',
    30,
    8,
    true,
    4,
    3,
    4
  ),
  (
    3,
    'Lunes,Miércoles,Viernes',
    'Tarde',
    '14:30:00',
    '18:30:00',
    20,
    12,
    true,
    5,
    2,
    2
  ),
  (
    4,
    'Martes,Jueves',
    'Mañana',
    '09:00:00',
    '13:00:00',
    45,
    5,
    true,
    6,
    4,
    3
  ),
  (
    5,
    'Lunes,Miércoles,Viernes',
    'Mañana',
    '08:00:00',
    '12:00:00',
    15,
    16,
    true,
    7,
    1,
    1
  ),
  (
    6,
    'Martes,Jueves',
    'Tarde',
    '14:00:00',
    '18:00:00',
    15,
    16,
    true,
    8,
    1,
    1
  ),
  (
    7,
    'Lunes a Viernes',
    'Noche',
    '18:00:00',
    '21:00:00',
    15,
    12,
    true,
    9,
    1,
    1
  ),
  (
    8,
    'Lunes,Martes',
    'Mañana',
    '09:00:00',
    '13:00:00',
    20,
    12,
    true,
    10,
    2,
    2
  ),
  (
    9,
    'Miércoles,Jueves',
    'Tarde',
    '14:30:00',
    '18:30:00',
    20,
    12,
    true,
    11,
    2,
    2
  ),
  (
    10,
    'Viernes',
    'Mañana',
    '08:00:00',
    '14:00:00',
    20,
    18,
    true,
    12,
    2,
    2
  ),
  (
    11,
    'Lunes,Miércoles',
    'Mañana',
    '08:30:00',
    '12:15:00',
    45,
    5,
    true,
    13,
    4,
    3
  ),
  (
    12,
    'Martes,Jueves',
    'Tarde',
    '14:00:00',
    '18:30:00',
    45,
    6,
    true,
    14,
    4,
    3
  ),
  (
    13,
    'Viernes',
    'Mañana',
    '09:00:00',
    '12:45:00',
    45,
    5,
    true,
    15,
    4,
    3
  ),
  (
    14,
    'Lunes,Martes',
    'Tarde',
    '14:00:00',
    '18:00:00',
    30,
    8,
    true,
    16,
    3,
    4
  ),
  (
    15,
    'Miércoles,Jueves',
    'Mañana',
    '08:00:00',
    '12:00:00',
    30,
    8,
    true,
    17,
    3,
    4
  ),
  (
    16,
    'Viernes',
    'Tarde',
    '13:00:00',
    '17:00:00',
    30,
    8,
    true,
    18,
    3,
    4
  ),
  (
    17,
    'Lunes,Miércoles,Viernes',
    'Mañana',
    '08:30:00',
    '12:30:00',
    40,
    6,
    true,
    19,
    5,
    5
  ),
  (
    18,
    'Martes,Jueves',
    'Tarde',
    '14:00:00',
    '18:00:00',
    40,
    6,
    true,
    20,
    5,
    5
  ),
  (
    19,
    'Lunes a Viernes',
    'Noche',
    '18:00:00',
    '21:00:00',
    40,
    4,
    true,
    21,
    5,
    5
  ),
  (
    20,
    'Lunes,Martes',
    'Mañana',
    '09:00:00',
    '13:00:00',
    30,
    8,
    true,
    22,
    6,
    6
  ),
  (
    21,
    'Miércoles,Jueves',
    'Tarde',
    '14:30:00',
    '18:30:00',
    30,
    8,
    true,
    23,
    6,
    6
  ),
  (
    22,
    'Viernes',
    'Mañana',
    '08:00:00',
    '13:00:00',
    30,
    10,
    true,
    24,
    6,
    6
  );
-- ==========================================================
-- 8. RESERVAS, CONSULTAS Y PAGOS
-- ==========================================================
INSERT INTO public.reservas_paciente (
    id_reserva_paciente,
    fecha_cita,
    hora_inicio_cita,
    hora_fin_cita,
    fecha_solicitud,
    estado,
    observaciones,
    id_usuario,
    id_especialidad,
    id_posta,
    id_doctor
  )
VALUES (
    1,
    '2026-02-23',
    '09:00:00',
    '09:20:00',
    NOW(),
    'FINALIZADA',
    'Chequeo rutinario por dolor de espalda',
    4,
    2,
    1,
    1
  ),
  (
    2,
    '2026-02-25',
    '10:00:00',
    '10:30:00',
    NOW(),
    'PENDIENTE',
    'Consulta inicial',
    4,
    4,
    1,
    4
  ),
  (
    3,
    '2026-02-26',
    '14:30:00',
    '15:15:00',
    NOW(),
    'CONFIRMADA',
    'Primera sesión de evaluación',
    10,
    3,
    2,
    6
  ),
  (
    4,
    '2026-02-27',
    '09:00:00',
    '09:40:00',
    NOW(),
    'PENDIENTE',
    'Dolor muscular por lesión deportiva',
    4,
    5,
    1,
    19
  ),
  (
    5,
    '2026-02-28',
    '10:00:00',
    '10:30:00',
    NOW(),
    'CONFIRMADA',
    'Control anual preventivo',
    10,
    6,
    1,
    22
  );
INSERT INTO public.consultas_medicas (
    id_consulta_medica,
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
VALUES (
    1,
    75.50,
    172.00,
    '120/80',
    36.50,
    72,
    'Dolor lumbar persistente',
    'Dolor agudo en zona baja de la espalda al sentarse',
    1,
    1
  );
INSERT INTO public.pagos (
    id_pago,
    monto,
    exento,
    motivo_exencion,
    fecha_pago,
    metodo_pago,
    id_consulta_medica,
    id_usuario_registro_pago
  )
VALUES (1, 20.00, false, NULL, NOW(), 'Efectivo', 1, 2);
-- ==========================================================
-- 9. ACTUALIZACIÓN DE SECUENCIAS
-- ==========================================================
SELECT pg_catalog.setval(
    'public.especialidades_medicas_id_especialidad_medica_seq',
    6,
    true
  );
SELECT pg_catalog.setval('public.postas_medicas_id_posta_seq', 2, true);
SELECT pg_catalog.setval('public.personas_id_persona_seq', 33, true);
SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 33, true);
SELECT pg_catalog.setval('public.roles_id_rol_seq', 25, true);
SELECT pg_catalog.setval('public.estudiantes_id_estudiante_seq', 2, true);
SELECT pg_catalog.setval('public.docentes_id_docente_seq', 2, true);
SELECT pg_catalog.setval(
    'public.administrativos_id_administrativo_seq',
    2,
    true
  );
SELECT pg_catalog.setval('public.doctores_id_doctor_seq', 24, true);
SELECT pg_catalog.setval(
    'public.consultorios_especialidad_id_consultorio_seq',
    6,
    true
  );
SELECT pg_catalog.setval(
    'public.asignacion_doctores_consultor_id_asignacion_doctores_consul_seq',
    22,
    true
  );
SELECT pg_catalog.setval(
    'public.configuracion_reservas_consul_id_configuracion_reservas_med_seq',
    1,
    true
  );
SELECT pg_catalog.setval(
    'public.reservas_paciente_id_reserva_paciente_seq',
    5,
    true
  );
SELECT pg_catalog.setval(
    'public.consultas_medicas_id_consulta_medica_seq',
    1,
    true
  );
SELECT pg_catalog.setval('public.pagos_id_pago_seq', 1, true);