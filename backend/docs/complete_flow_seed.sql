-- =============================================================================
-- SCRIPT DE INSERCIÓN DE DATOS PARA FLUJO COMPLETO - PROYECTO POSTAS UMSA (FIXED)
-- Este archivo genera los datos necesarios para probar el flujo completo.
-- Nota: Si obtiene error de transacción, revise la consola para ver el PRIMER error.
-- =============================================================================
BEGIN;
-- 1. ESPECIALIDADES MÉDICAS
-- Usamos una técnica que evita fallos si ya existen (sin depender de indices únicos en 'codigo')
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto,
        visible,
        activo
    )
SELECT 'Enfermería',
    'ENF-01',
    'Triaje y signos vitales',
    15,
    true,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.especialidades_medicas
        WHERE codigo = 'ENF-01'
    );
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto,
        visible,
        activo
    )
SELECT 'Medicina General',
    'MED-GEN',
    'Atención médica primaria',
    20,
    true,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.especialidades_medicas
        WHERE codigo = 'MED-GEN'
    );
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto,
        visible,
        activo
    )
SELECT 'Psicología',
    'PSI-CLI',
    'Evaluación y terapia',
    45,
    true,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.especialidades_medicas
        WHERE codigo = 'PSI-CLI'
    );
INSERT INTO public.especialidades_medicas (
        nombre,
        codigo,
        descripcion,
        tiempo_cita_por_defecto,
        visible,
        activo
    )
SELECT 'Odontología',
    'ODO-BS',
    'Salud oral básica',
    30,
    true,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.especialidades_medicas
        WHERE codigo = 'ODO-BS'
    );
-- 2. POSTAS MÉDICAS
INSERT INTO public.postas_medicas (
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
SELECT 'Posta Central Monoblock',
    'PST-MONO',
    'Av. Villazón, Monoblock Central',
    '2440000',
    '08:30:00',
    '12:30:00',
    '14:30:00',
    '18:30:00',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.postas_medicas
        WHERE codigo = 'PST-MONO'
    );
INSERT INTO public.postas_medicas (
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
SELECT 'Posta Campus Cota Cota',
    'PST-COTA',
    'Calle 27 Cota Cota',
    '2790000',
    '09:00:00',
    '13:00:00',
    '14:00:00',
    '18:00:00',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.postas_medicas
        WHERE codigo = 'PST-COTA'
    );
-- 3. CONSULTORIOS POR ESPECIALIDAD
INSERT INTO public.consultorios_especialidad (
        fecha_habilitacion,
        numero_consultorio,
        piso_ubicacion,
        activo,
        id_posta,
        id_especialidad
    )
SELECT CURRENT_DATE,
    'T-01',
    'PB',
    true,
    (
        SELECT id_posta
        FROM postas_medicas
        WHERE codigo = 'PST-MONO'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'ENF-01'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM public.consultorios_especialidad
        WHERE numero_consultorio = 'T-01'
            AND id_posta = (
                SELECT id_posta
                FROM postas_medicas
                WHERE codigo = 'PST-MONO'
            )
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
    'M-01',
    'PB',
    true,
    (
        SELECT id_posta
        FROM postas_medicas
        WHERE codigo = 'PST-MONO'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'MED-GEN'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM public.consultorios_especialidad
        WHERE numero_consultorio = 'M-01'
            AND id_posta = (
                SELECT id_posta
                FROM postas_medicas
                WHERE codigo = 'PST-MONO'
            )
    );
-- 4. PERSONAS
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento,
        genero,
        celular,
        email,
        activo
    )
VALUES (
        '1111111 LP',
        'Dr. Ricardo',
        'Vargas',
        'Mendoza',
        '1975-05-20',
        'M',
        '77700001',
        'ricardo.vargas@med.bo',
        true
    ) ON CONFLICT (ci) DO NOTHING;
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento,
        genero,
        celular,
        email,
        activo
    )
VALUES (
        '2222222 LP',
        'Dra. Elena',
        'Paredes',
        NULL,
        '1982-10-15',
        'F',
        '77700002',
        'elena.paredes@med.bo',
        true
    ) ON CONFLICT (ci) DO NOTHING;
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento,
        genero,
        celular,
        email,
        activo
    )
VALUES (
        '3333333 LP',
        'Lic. Pedro',
        'Mamani',
        'Quispe',
        '1990-03-05',
        'M',
        '77700003',
        'pedro.mamani@enf.bo',
        true
    ) ON CONFLICT (ci) DO NOTHING;
INSERT INTO public.personas (
        ci,
        nombres,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento,
        genero,
        celular,
        email,
        activo
    )
VALUES (
        '9876543 LP',
        'Carlos',
        'Estudiante',
        'Ejemplo',
        '2003-01-20',
        'M',
        '70000001',
        'carlos.estudiante@umsa.bo',
        true
    ) ON CONFLICT (ci) DO NOTHING;
-- 5. USUARIOS
INSERT INTO public.usuarios (username, password, id_persona, fecha_creacion)
VALUES (
        'dr.vargas',
        '$2y$10$abcdefghijklmnopqrstuvwx',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '1111111 LP'
        ),
        NOW()
    ) ON CONFLICT (username) DO NOTHING;
INSERT INTO public.usuarios (username, password, id_persona, fecha_creacion)
VALUES (
        'dra.paredes',
        '$2y$10$abcdefghijklmnopqrstuvwx',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '2222222 LP'
        ),
        NOW()
    ) ON CONFLICT (username) DO NOTHING;
INSERT INTO public.usuarios (username, password, id_persona, fecha_creacion)
VALUES (
        'paciente.carlos',
        '$2y$10$abcdefghijklmnopqrstuvwx',
        (
            SELECT id_persona
            FROM personas
            WHERE ci = '9876543 LP'
        ),
        NOW()
    ) ON CONFLICT (username) DO NOTHING;
-- 6. DOCTORES
-- Usamos id_persona como clave de unicidad para evitar duplicados
INSERT INTO public.doctores (
        id_persona,
        id_especialidad_medica,
        matricula_profesional,
        experiencia_profesional
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '1111111 LP'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'MED-GEN'
    ),
    'MED-12345',
    '15 años en medicina interna'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.doctores
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '1111111 LP'
            )
    );
INSERT INTO public.doctores (
        id_persona,
        id_especialidad_medica,
        matricula_profesional,
        experiencia_profesional
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '2222222 LP'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'PSI-CLI'
    ),
    'PSI-67890',
    '10 años en psicología clínica'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.doctores
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '2222222 LP'
            )
    );
INSERT INTO public.doctores (
        id_persona,
        id_especialidad_medica,
        matricula_profesional,
        experiencia_profesional
    )
SELECT (
        SELECT id_persona
        FROM personas
        WHERE ci = '3333333 LP'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'ENF-01'
    ),
    'ENF-11111',
    '8 años en emergencias'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.doctores
        WHERE id_persona = (
                SELECT id_persona
                FROM personas
                WHERE ci = '3333333 LP'
            )
    );
-- 7. ASIGNACIÓN DOCTOR A CONSULTORIO
INSERT INTO public.asignacion_doctores_consultorio (
        id_doctor,
        id_consultorio,
        id_especialidad,
        dias_semana,
        turno,
        hora_inicio,
        hora_fin,
        duracion_cita,
        activo
    )
SELECT (
        SELECT id_doctor
        FROM doctores d
            JOIN personas p ON d.id_persona = p.id_persona
        WHERE p.ci = '1111111 LP'
    ),
    (
        SELECT id_consultorio
        FROM consultorios_especialidad
        WHERE numero_consultorio = 'M-01'
        LIMIT 1
    ), (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'MED-GEN'
    ),
    'Lunes,Martes,Miércoles',
    'Mañana',
    '08:30:00',
    '12:30:00',
    20,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.asignacion_doctores_consultorio
        WHERE id_doctor = (
                SELECT id_doctor
                FROM doctores d
                    JOIN personas p ON d.id_persona = p.id_persona
                WHERE p.ci = '1111111 LP'
            )
    );
-- 8. FLUJO COMPLETO: RESERVA -> CONSULTA/TRIAJE -> PAGO -> DERIVACIÓN
-- A. Reserva para Medicina General
INSERT INTO public.reservas_paciente (
        fecha_cita,
        hora_inicio_cita,
        hora_fin_cita,
        fecha_solicitud,
        observaciones,
        estado,
        id_usuario,
        id_especialidad,
        id_posta,
        id_doctor
    )
SELECT CURRENT_DATE - INTERVAL '1 day',
    '09:00:00',
    '09:20:00',
    NOW() - INTERVAL '2 days',
    'Chequeo rutinario por dolor de espalda',
    'FINALIZADA',
    (
        SELECT id_usuario
        FROM usuarios
        WHERE username = 'paciente.carlos'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'MED-GEN'
    ),
    (
        SELECT id_posta
        FROM postas_medicas
        WHERE codigo = 'PST-MONO'
    ),
    (
        SELECT id_doctor
        FROM doctores d
            JOIN personas p ON d.id_persona = p.id_persona
        WHERE p.ci = '1111111 LP'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM public.reservas_paciente
        WHERE id_usuario = (
                SELECT id_usuario
                FROM usuarios
                WHERE username = 'paciente.carlos'
            )
            AND fecha_cita = CURRENT_DATE - INTERVAL '1 day'
    );
-- B. Consulta Médica
INSERT INTO public.consultas_medicas (
        id_reserva_paciente,
        id_doctor,
        peso_kl,
        estatura_cm,
        presion_arterial,
        temperatura,
        frecuencia_cardiaca,
        motivo_consulta,
        sintomas
    )
SELECT (
        SELECT id_reserva_paciente
        FROM reservas_paciente
        WHERE observaciones LIKE '%dolor de espalda%'
        ORDER BY id_reserva_paciente DESC
        LIMIT 1
    ), (
        SELECT id_doctor
        FROM doctores d
            JOIN personas p ON d.id_persona = p.id_persona
        WHERE p.ci = '1111111 LP'
    ),
    75.5,
    172.0,
    '120/80',
    36.5,
    72,
    'Dolor lumbar persistente',
    'Dolor agudo en zona baja de la espalda al sentarse'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.consultas_medicas
        WHERE id_reserva_paciente = (
                SELECT id_reserva_paciente
                FROM reservas_paciente
                WHERE observaciones LIKE '%dolor de espalda%'
                ORDER BY id_reserva_paciente DESC
                LIMIT 1
            )
    );
-- C. Pago de la consulta
INSERT INTO public.pagos (
        id_consulta_medica,
        monto,
        exento,
        fecha_pago,
        metodo_pago,
        id_usuario_registro_pago
    )
SELECT (
        SELECT id_consulta_medica
        FROM consultas_medicas cm
            JOIN reservas_paciente rp ON cm.id_reserva_paciente = rp.id_reserva_paciente
        WHERE rp.observaciones LIKE '%dolor de espalda%'
        ORDER BY cm.id_consulta_medica DESC
        LIMIT 1
    ), 20.00, false, NOW() - INTERVAL '1 day',
    'Efectivo',
    (
        SELECT id_usuario
        FROM usuarios
        WHERE username = 'dr.vargas'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM public.pagos
        WHERE id_consulta_medica = (
                SELECT id_consulta_medica
                FROM consultas_medicas cm
                    JOIN reservas_paciente rp ON cm.id_reserva_paciente = rp.id_reserva_paciente
                WHERE rp.observaciones LIKE '%dolor de espalda%'
                ORDER BY cm.id_consulta_medica DESC
                LIMIT 1
            )
    );
-- D. Derivación
INSERT INTO public.derivaciones (id_usuario, id_especialidad, fecha)
SELECT (
        SELECT id_usuario
        FROM usuarios
        WHERE username = 'paciente.carlos'
    ),
    (
        SELECT id_especialidad_medica
        FROM especialidades_medicas
        WHERE codigo = 'PSI-CLI'
    ),
    NOW() - INTERVAL '23 hours'
WHERE NOT EXISTS (
        SELECT 1
        FROM public.derivaciones
        WHERE id_usuario = (
                SELECT id_usuario
                FROM usuarios
                WHERE username = 'paciente.carlos'
            )
            AND id_especialidad = (
                SELECT id_especialidad_medica
                FROM especialidades_medicas
                WHERE codigo = 'PSI-CLI'
            )
    );
COMMIT;