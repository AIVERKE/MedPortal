-- =============================================================================
-- SEED COMPLETO DEL SISTEMA (COMPATIBLE CON ESQUEMA ACTUAL)
-- Proyecto: backendPostasUmsa
-- Autor: Codex
-- Uso:
--   psql -h localhost -U postgres -d postas_umsa -v ON_ERROR_STOP=1 -f docs/seed-completo-sistema.sql
-- Credencial común para usuarios de prueba: password123
-- Hash bcrypt de password123: $2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y
-- =============================================================================

BEGIN;

TRUNCATE TABLE
  public.derivaciones,
  public.reservas_paciente_canceladas,
  public.historias_clinicas,
  public.recetas,
  public.certificados,
  public.notas_sesion,
  public.historia_clinica,
  public.consulta,
  public.consultas_medicas,
  public.pagos,
  public.hcl_psicologia_notas,
  public.hcl_no_patologicos,
  public.hcl_examen_fisico,
  public.hcl_ant_go,
  public.emergencias,
  public.asignacion_doctores_consultorio,
  public.contratos_consultores,
  public.consultorios_especialidad,
  public.configuracion_reservas_consultas,
  public.fecha_cierre,
  public.consejo_diario,
  public.historial_usuarios,
  public.asignacion_roles,
  public.roles,
  public.usuarios,
  public.doctores,
  public.estudiantes,
  public.docentes,
  public.administrativos,
  public.consultores,
  public.personas,
  public.postas_medicas,
  public.especialidades_medicas,
  public.cat_enfermedades,
  public.cat_antecedentes_no_pat
RESTART IDENTITY CASCADE;

-- 1) Catálogos base
INSERT INTO public.cat_enfermedades (codigo_cie10, nombre_enfermedad, es_cronica)
VALUES
  ('J00', 'Resfriado común', false),
  ('K02', 'Caries dental', false),
  ('F41.1', 'Trastorno de ansiedad generalizada', true);

INSERT INTO public.cat_antecedentes_no_pat (nombre_antecedente, descripcion)
VALUES
  ('Tabaquismo', 'Consumo habitual de tabaco'),
  ('Sedentarismo', 'Actividad física insuficiente'),
  ('Alergia alimentaria', 'Antecedente de alergias a alimentos');

INSERT INTO public.consejo_diario (titulo, contenido, categoria, "fechaPublicacion", activo)
VALUES
  ('Hidratación diaria', 'Consume al menos 8 vasos de agua al día.', 'Prevención', CURRENT_DATE, true),
  ('Salud mental', 'Dormir 7-8 horas mejora el estado de ánimo y la concentración.', 'Bienestar', CURRENT_DATE, true),
  ('Actividad física', 'Caminar 30 minutos diarios aporta beneficios cardiovasculares.', 'Hábitos', CURRENT_DATE, true);

INSERT INTO public.configuracion_reservas_consultas (
  dias_semana,
  hora_inicio_reserva,
  hora_fin_reserva,
  dias_anticipacion_minima,
  dias_anticipacion_maxima
)
VALUES ('LUNES,MARTES,MIERCOLES,JUEVES,VIERNES', '08:00:00', '18:00:00', 0, 30);

INSERT INTO public.fecha_cierre (fecha, descripcion)
VALUES
  (CURRENT_DATE + INTERVAL '10 day', 'Mantenimiento de infraestructura'),
  (CURRENT_DATE + INTERVAL '25 day', 'Feriado institucional');

-- 2) Estructura médica
INSERT INTO public.especialidades_medicas (nombre, codigo, descripcion, tiempo_cita_por_defecto, visible, activo)
VALUES
  ('Medicina General', 'MED-GEN', 'Atención médica general', 20, true, true),
  ('Odontología', 'ODO-GEN', 'Atención odontológica integral', 30, true, true),
  ('Psicología', 'PSI-GEN', 'Atención psicológica clínica', 45, true, true);

INSERT INTO public.postas_medicas (
  nombre, codigo, direccion, telefono, ubicacion_gps,
  horario_atencion_manana_inicio, horario_atencion_manana_fin,
  horario_atencion_tarde_inicio, horario_atencion_tarde_fin, activo
)
VALUES (
  'Posta Central UMSA',
  'PC-UMSA-01',
  'Av. Villazón, Campus Universitario',
  '2412345',
  '-16.5045,-68.1206',
  '08:00:00',
  '12:00:00',
  '14:00:00',
  '18:00:00',
  true
);

INSERT INTO public.consultorios_especialidad (
  fecha_habilitacion, numero_consultorio, piso_ubicacion, activo, id_posta, id_especialidad
)
SELECT
  CURRENT_DATE,
  'CONS-' || em.codigo,
  '1er Piso',
  true,
  (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'PC-UMSA-01'),
  em.id_especialidad_medica
FROM public.especialidades_medicas em;

-- 3) Personas y usuarios
INSERT INTO public.personas (
  ci, nombres, primer_apellido, segundo_apellido, fecha_nacimiento, genero, celular, email, direccion, activo
)
VALUES
  ('SEED-ADM-001', 'Carla', 'Mamani', 'Rojas', '1985-03-10', 'F', '70000001', 'carla.mamani@umsa.bo', 'Zona Central', true),
  ('SEED-EST-001', 'Luis', 'Torrez', 'Flores', '2003-09-15', 'M', '70000002', 'luis.torrez@umsa.bo', 'Miraflores', true),
  ('SEED-DOC-001', 'Fernanda', 'Colque', 'Quispe', '1980-07-20', 'F', '70000003', 'fernanda.colque@umsa.bo', 'Sopocachi', true),
  ('SEED-NST-001', 'Marco', 'Zapata', 'Loza', '1988-01-25', 'M', '70000004', 'marco.zapata@umsa.bo', 'San Pedro', true),
  ('SEED-CON-001', 'Andrea', 'Villca', 'Paredes', '1990-11-05', 'F', '70000005', 'andrea.villca@umsa.bo', 'Obrajes', true),
  ('SEED-DIR-001', 'Edgar', 'Huanca', 'Mendoza', '1978-02-12', 'M', '70000006', 'edgar.huanca@umsa.bo', 'Calacoto', true),
  ('SEED-DOCMED-001', 'Juan', 'Quispe', 'Arias', '1979-04-17', 'M', '70000007', 'juan.quispe@umsa.bo', 'Achumani', true),
  ('SEED-DOCODO-001', 'Paola', 'Rojas', 'Chura', '1984-12-01', 'F', '70000008', 'paola.rojas@umsa.bo', 'Tembladerani', true),
  ('SEED-DOCPSI-001', 'Diego', 'Calle', 'Mamani', '1987-05-30', 'M', '70000009', 'diego.calle@umsa.bo', 'Villa Fátima', true),
  ('SEED-PAC-001', 'Valeria', 'Choque', 'Luna', '2001-08-21', 'F', '70000010', 'valeria.choque@umsa.bo', 'Seguencoma', true);

INSERT INTO public.usuarios (username, password, bloqueado, id_persona, is_book)
VALUES
  ('c.mamani.superadmin', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-ADM-001'), false),
  ('l.torrez.estudiante', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-EST-001'), false),
  ('f.colque.docente', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOC-001'), false),
  ('m.zapata.administrativo', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-NST-001'), false),
  ('a.villca.consultor', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-CON-001'), false),
  ('e.huanca.director', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DIR-001'), false),
  ('j.quispe.medicina', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCMED-001'), false),
  ('p.rojas.odontologia', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCODO-001'), false),
  ('d.calle.psicologia', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCPSI-001'), false),
  ('v.choque.paciente', '$2b$10$8I/uncl9Y6e4ONcWsNMgGezuVW22Wun0lHM5KiNf8sL45HOzIpB8y', false, (SELECT id_persona FROM public.personas WHERE ci = 'SEED-PAC-001'), false);

-- 4) Roles (modelo nuevo)
INSERT INTO public.roles (nombre)
VALUES
  ('SUPERUSUARIO'),
  ('ESTUDIANTE'),
  ('DOCENTE'),
  ('ADMINISTRATIVO'),
  ('CONSULTOR'),
  ('DIRECTOR'),
  ('DOCTOR');

INSERT INTO public.asignacion_roles (id_persona, id_rol, fecha_asignacion, activo)
SELECT p.id_persona, r.id_rol, CURRENT_DATE, true
FROM public.personas p
JOIN public.roles r ON r.nombre =
  CASE
    WHEN p.ci = 'SEED-ADM-001' THEN 'SUPERUSUARIO'
    WHEN p.ci = 'SEED-EST-001' THEN 'ESTUDIANTE'
    WHEN p.ci = 'SEED-DOC-001' THEN 'DOCENTE'
    WHEN p.ci = 'SEED-NST-001' THEN 'ADMINISTRATIVO'
    WHEN p.ci = 'SEED-CON-001' THEN 'CONSULTOR'
    WHEN p.ci = 'SEED-DIR-001' THEN 'DIRECTOR'
    WHEN p.ci IN ('SEED-DOCMED-001', 'SEED-DOCODO-001', 'SEED-DOCPSI-001') THEN 'DOCTOR'
    WHEN p.ci = 'SEED-PAC-001' THEN 'ESTUDIANTE'
  END;

-- 5) Perfiles específicos
INSERT INTO public.estudiantes (id_persona, registro_universitario, carrera, facultad, activo)
VALUES
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-EST-001'), 'RU-SEED-001', 'Ingeniería de Sistemas', 'Facultad de Tecnología', true),
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-PAC-001'), 'RU-SEED-002', 'Medicina', 'Facultad de Medicina', true);

INSERT INTO public.docentes (id_persona, numero_item, facultad, interino_contratado, activo)
VALUES
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOC-001'), 'DOC-ITEM-001', 'Ciencias Puras', 'Titular', true);

INSERT INTO public.administrativos (id_persona, numero_item, cargo, unidad)
VALUES
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-NST-001'), 'ADM-ITEM-001', 'Analista', 'Dirección Administrativa');

INSERT INTO public.consultores (id_persona)
VALUES
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-CON-001'));

INSERT INTO public.contratos_consultores (id_servicio, unidad, fecha_inicio_contrato, fecha_fin_contrato, cargo, documento_contrato_url, id_consultor)
VALUES (
  101,
  'Bienestar Social',
  CURRENT_DATE - INTERVAL '30 day',
  CURRENT_DATE + INTERVAL '335 day',
  'Consultor TIC',
  'https://example.org/contrato-consultor-seed.pdf',
  (SELECT id_consultor FROM public.consultores c JOIN public.personas p ON p.id_persona = c.id_persona WHERE p.ci = 'SEED-CON-001')
);

INSERT INTO public.doctores (
  id_persona, id_especialidad_medica, matricula_profesional, experiencia_profesional,
  universidad_origen, titulo_profesional, telefono_emergencia
)
VALUES
  (
    (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCMED-001'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'MED-GEN'),
    'MAT-MED-001', '12 años', 'UMSA', 'Médico/a Cirujano/a', '71230001'
  ),
  (
    (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCODO-001'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'ODO-GEN'),
    'MAT-ODO-001', '9 años', 'UMSA', 'Odontólogo/a', '71230002'
  ),
  (
    (SELECT id_persona FROM public.personas WHERE ci = 'SEED-DOCPSI-001'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'PSI-GEN'),
    'MAT-PSI-001', '8 años', 'UMSA', 'Psicólogo/a Clínico/a', '71230003'
  );

-- 6) Operación clínica y reservas
INSERT INTO public.asignacion_doctores_consultorio (
  dias_semana, turno, hora_inicio, hora_fin, duracion_cita, cupos_disponibles, activo, id_doctor, id_consultorio, id_especialidad
)
SELECT
  'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES',
  'MANANA',
  '08:00:00',
  '12:00:00',
  em.tiempo_cita_por_defecto,
  20,
  true,
  d.id_doctor,
  ce.id_consultorio,
  em.id_especialidad_medica
FROM public.doctores d
JOIN public.especialidades_medicas em ON em.id_especialidad_medica = d.id_especialidad_medica
JOIN public.consultorios_especialidad ce ON ce.id_especialidad = em.id_especialidad_medica;

INSERT INTO public.reservas_paciente (
  fecha_cita, hora_inicio_cita, hora_fin_cita, estado, observaciones,
  id_usuario, id_especialidad, id_posta, id_doctor, fecha_atendido, hora_atendido
)
VALUES
  (
    CURRENT_DATE - INTERVAL '1 day',
    '09:00:00',
    '09:20:00',
    'ATENDIDO',
    'Consulta completada',
    (SELECT id_usuario FROM public.usuarios WHERE username = 'v.choque.paciente'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'MED-GEN'),
    (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'PC-UMSA-01'),
    (
      SELECT d.id_doctor
      FROM public.doctores d
      JOIN public.personas p ON p.id_persona = d.id_persona
      WHERE p.ci = 'SEED-DOCMED-001'
    ),
    CURRENT_DATE - INTERVAL '1 day',
    '09:18:00'
  ),
  (
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    '10:20:00',
    'PENDIENTE',
    'Control odontológico',
    (SELECT id_usuario FROM public.usuarios WHERE username = 'v.choque.paciente'),
    (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'ODO-GEN'),
    (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'PC-UMSA-01'),
    (
      SELECT d.id_doctor
      FROM public.doctores d
      JOIN public.personas p ON p.id_persona = d.id_persona
      WHERE p.ci = 'SEED-DOCODO-001'
    ),
    NULL,
    NULL
  );

INSERT INTO public.reservas_paciente_canceladas (
  fecha_cita, hora_inicio_cita, hora_fin_cita, fecha_solicitud, motivo_cancelacion, estado,
  id_usuario, id_especialidad, id_posta, id_doctor
)
VALUES (
  CURRENT_DATE + INTERVAL '2 day',
  '11:00:00',
  '11:20:00',
  NOW(),
  'Reprogramación por viaje',
  'CANCELADO',
  (SELECT id_usuario FROM public.usuarios WHERE username = 'v.choque.paciente'),
  (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'PSI-GEN'),
  (SELECT id_posta FROM public.postas_medicas WHERE codigo = 'PC-UMSA-01'),
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCPSI-001'
  )
);

INSERT INTO public.consultas_medicas (
  id_reserva_paciente, id_doctor, peso_kl, estatura_cm, presion_arterial, temperatura, frecuencia_cardiaca, motivo_consulta, sintomas
)
VALUES (
  (SELECT id_reserva_paciente FROM public.reservas_paciente WHERE estado = 'ATENDIDO' ORDER BY id_reserva_paciente LIMIT 1),
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCMED-001'
  ),
  62.50,
  165.00,
  '120/80',
  36.70,
  74,
  'Control por malestar general',
  'Cefalea leve y congestión'
);

INSERT INTO public.historia_clinica (id_persona)
VALUES ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-PAC-001'));

INSERT INTO public.historias_clinicas (numero_historia, id_usuario)
VALUES ('HC-UMSA-0001', (SELECT id_usuario FROM public.usuarios WHERE username = 'v.choque.paciente'));

INSERT INTO public.consulta (
  id_hcl, id_reserva_paciente, id_doctor, id_enfermedad, enfermedad_especificacion,
  motivo_consulta, impresion_diagnostica, conducta_tratamiento, evolucion
)
VALUES (
  (SELECT id_hcl FROM public.historia_clinica ORDER BY id_hcl LIMIT 1),
  (SELECT id_reserva_paciente FROM public.reservas_paciente WHERE estado = 'ATENDIDO' ORDER BY id_reserva_paciente LIMIT 1),
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCMED-001'
  ),
  (SELECT id_enfermedad FROM public.cat_enfermedades WHERE codigo_cie10 = 'J00'),
  'Resfriado común sin complicaciones',
  'Rinorrea y cefalea',
  'Cuadro respiratorio alto viral',
  'Tratamiento sintomático y reposo',
  'Estable'
);

INSERT INTO public.hcl_examen_fisico (
  id_consulta, presion_arterial, pulso, temperatura, peso_kg, talla_cm, imc, sistemas_json, observaciones_fisicas
)
VALUES (
  (SELECT id_consulta FROM public.consulta ORDER BY id_consulta LIMIT 1),
  '120/80',
  74,
  36.7,
  62.5,
  165.0,
  22.95,
  '{"respiratorio":"sin sibilancias","cardiovascular":"rítmico","abdomen":"blando"}',
  'Paciente hemodinámicamente estable'
);

INSERT INTO public.hcl_ant_go (
  id_consulta, gestas, partos, abortos, fum, ritmo_menstrual, planificacion_familiar, metodo_descripcion
)
VALUES (
  (SELECT id_consulta FROM public.consulta ORDER BY id_consulta LIMIT 1),
  1, 1, 0, CURRENT_DATE - INTERVAL '20 day', 'regular', true, 'Método barrera'
);

INSERT INTO public.hcl_no_patologicos (id_consulta, id_hcl, id_cat_ant_no_pat, observacion)
VALUES (
  (SELECT id_consulta FROM public.consulta ORDER BY id_consulta LIMIT 1),
  (SELECT id_hcl FROM public.historia_clinica ORDER BY id_hcl LIMIT 1),
  (SELECT id_cat_ant_no_pat FROM public.cat_antecedentes_no_pat WHERE nombre_antecedente = 'Sedentarismo'),
  'Realiza poca actividad física semanal'
);

INSERT INTO public.hcl_psicologia_notas (
  id_hcl, id_reserva_paciente, id_psicologo, nro_sesion, motivo_consulta, bitacora_confidencial, diagnostico_psic
)
VALUES (
  (SELECT id_hcl FROM public.historia_clinica ORDER BY id_hcl LIMIT 1),
  (SELECT id_reserva_paciente FROM public.reservas_paciente ORDER BY id_reserva_paciente DESC LIMIT 1),
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCPSI-001'
  ),
  1,
  'Estrés académico',
  'Se acuerda seguimiento psicoterapéutico.',
  'Ansiedad leve situacional'
);

INSERT INTO public.notas_sesion (id_consulta_medica, contenido)
VALUES (
  (SELECT id_consulta_medica FROM public.consultas_medicas ORDER BY id_consulta_medica LIMIT 1),
  'Se orienta sobre hidratación, reposo y control en 72 horas si persisten síntomas.'
);

INSERT INTO public.recetas (id_consulta_medica, detalle)
VALUES (
  (SELECT id_consulta_medica FROM public.consultas_medicas ORDER BY id_consulta_medica LIMIT 1),
  'Paracetamol 500 mg c/8h por 3 días + lavado nasal con solución salina.'
);

INSERT INTO public.certificados (id_consulta_medica, tipo, contenido, dias_baja)
VALUES (
  (SELECT id_consulta_medica FROM public.consultas_medicas ORDER BY id_consulta_medica LIMIT 1),
  'MEDICO',
  'Se certifica reposo médico por cuadro respiratorio agudo no complicado.',
  2
);

INSERT INTO public.pagos (monto, exento, motivo_exencion, metodo_pago, id_consulta_medica, id_usuario_registro_pago)
VALUES (
  15.00,
  false,
  NULL,
  'EFECTIVO',
  (SELECT id_consulta_medica FROM public.consultas_medicas ORDER BY id_consulta_medica LIMIT 1),
  (SELECT id_usuario FROM public.usuarios WHERE username = 'm.zapata.administrativo')
);

INSERT INTO public.emergencias (
  nombre_paciente, fecha_atencion, hora_inicio, hora_fin, descripcion_caso, id_doctor
)
VALUES (
  'Paciente NN',
  CURRENT_DATE,
  '15:10:00',
  '15:45:00',
  'Atención de urgencia por crisis hipertensiva moderada, estabilizado.',
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCMED-001'
  )
);

INSERT INTO public.derivaciones (
  id_especialidad, id_hcl, id_consulta_origen, id_doctor_emisor,
  motivo_referencia, diagnostico_presuntivo, resumen_salud, estado
)
VALUES (
  (SELECT id_especialidad_medica FROM public.especialidades_medicas WHERE codigo = 'PSI-GEN'),
  (SELECT id_hcl FROM public.historia_clinica ORDER BY id_hcl LIMIT 1),
  (SELECT id_consulta FROM public.consulta ORDER BY id_consulta LIMIT 1),
  (
    SELECT d.id_doctor
    FROM public.doctores d
    JOIN public.personas p ON p.id_persona = d.id_persona
    WHERE p.ci = 'SEED-DOCMED-001'
  ),
  'Apoyo en manejo de estrés y ansiedad',
  'Ansiedad leve reactiva',
  'Paciente estable, colaborador y orientado.',
  'PENDIENTE'
);

INSERT INTO public.historial_usuarios (id_persona, intento_fallido)
VALUES
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-ADM-001'), false),
  ((SELECT id_persona FROM public.personas WHERE ci = 'SEED-PAC-001'), false);

COMMIT;
