import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly UsersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: any) {
    const user = await this.UsersService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const est = user.persona?.estudiante;
    const estudiante = est
      ? {
          idEstudiante: est.idEstudiante,
          registroUniversitario: est.registroUniversitario,
          documentoMatriculaUrl: est.documentoMatriculaUrl,
          documentoCarnetUrl: est.documentoCarnetUrl,
          carrera: est.carrera,
          facultad: est.facultad,
        }
      : null;

    const doc = user.persona?.doctor;
    const doctor = doc
      ? {
          idDoctor: doc.idDoctor,
          matriculaProfesional: doc.matriculaProfesional,
          experienciaProfesional: doc.experienciaProfesional,
          universidadOrigen: doc.universidadOrigen,
          tituloProfesional: doc.tituloProfesional,
          telefonoEmergencia: doc.telefonoEmergencia,
          compartirTelefonoEmergencia: Boolean(doc.compartirTelefonoEmergencia),
          especialidad: doc.especialidad
            ? {
                idEspecialidadMedica: doc.especialidad.idEspecialidadMedica,
                nombre: doc.especialidad.nombre,
                tiempoCitaPorDefecto: doc.especialidad.tiempoCitaPorDefecto,
              }
            : null,
        }
      : null;

    const consultorEntity = user.persona?.consultor;
    const consultor = consultorEntity
      ? { idConsultor: consultorEntity.idConsultor }
      : null;

    const docenteEntity = user.persona?.docente;
    const docente = docenteEntity
      ? {
          idDocente: docenteEntity.idDocente,
          numeroItem: docenteEntity.numeroItem,
          facultad: docenteEntity.facultad,
          interinoContratado: docenteEntity.interinoContratado,
        }
      : null;

    const administrativoEntity = user.persona?.administrativo;
    const administrativo = administrativoEntity
      ? {
          idAdministrativo: administrativoEntity.idAdministrativo,
          numeroItem: administrativoEntity.numeroItem,
          unidad: administrativoEntity.unidad,
          cargo: administrativoEntity.cargo,
          estadoLaboral: administrativoEntity.estadoLaboral,
        }
      : null;

    const roles =
      user.persona?.asignacionesRoles
        ?.filter((ar) => ar.activo !== false && ar.rol)
        .map((ar) => ({
          idRol: ar.rol.idRol,
          nombre: ar.rol.nombre,
        })) || [];

    const mustChangePassword = user.password
      ? await bcrypt.compare(user.username, user.password)
      : false;

    // Basamos el rol 100% en lo que viene en el token (seleccionado en login)
    return {
      idUsuario: user.idUsuario,
      idPersona: user.persona?.idPersona,
      username: user.username,
      is_book: user.is_book,
      nombres: user.persona?.nombres,
      ci: user.persona?.ci,
      primerApellido: user.persona?.primerApellido,
      segundoApellido: user.persona?.segundoApellido,
      genero: user.persona?.genero,
      celular: user.persona?.celular,
      email: user.persona?.email,
      direccion: user.persona?.direccion,
      foto: user.persona?.foto,
      rol: payload.rolNombre, // Tomado directamente del JWT
      rolId: payload.rolId,
      doctor,
      estudiante,
      docente,
      administrativo,
      consultor,
      roles,
      mustChangePassword,
    };
  }
}
