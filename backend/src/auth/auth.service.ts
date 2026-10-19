import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // Verificar si la persona está activa
      if (user.persona && !user.persona.activo) {
        throw new UnauthorizedException(
          'Tu cuenta está bloqueada, contactate con un administrador para solucionarlo',
        );
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, idRol?: number, plainPassword?: string) {
    const userWithRoles = await this.usersService.findOneById(user.idUsuario);
    if (!userWithRoles) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const roles = userWithRoles.persona?.asignacionesRoles
      ?.filter(r => r.activo)
      .map(r => ({ idRol: r.rol.idRol, nombre: r.rol.nombre })) || [];

    // Si se provee un idRol, validamos que el usuario lo tenga asignado
    let selectedRole: { idRol: number, nombre: string } | null = null;
    if (idRol) {
      selectedRole = roles.find(r => r.idRol === Number(idRol)) || null;
      if (!selectedRole) {
        throw new UnauthorizedException('El rol seleccionado no es válido para este usuario');
      }
    } else if (roles.length === 1) {
      // Si solo tiene un rol, lo seleccionamos automáticamente
      selectedRole = roles[0];
    } else if (roles.length > 1) {
      // Si tiene varios y no seleccionó ninguno, retornamos la lista para que el front elija
      return {
        requireRoleSelection: true,
        roles: roles
      };
    } else {
      throw new UnauthorizedException('El usuario no tiene roles asignados');
    }

    const payload = {
      username: user.username,
      sub: user.idUsuario,
      idPersona: userWithRoles.persona?.idPersona,
      rolId: selectedRole.idRol,
      rolNombre: selectedRole.nombre
    };

    const mustChangePassword =
      !!plainPassword && plainPassword === user.username;

    return {
      access_token: this.jwtService.sign(payload),
      mustChangePassword,
    };
  }

  async switchRole(idUsuario: number, idRol: number) {
    const userWithRoles = await this.usersService.findOneById(idUsuario);
    if (!userWithRoles) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (userWithRoles.persona && !userWithRoles.persona.activo) {
      throw new UnauthorizedException(
        'Tu cuenta está bloqueada, contactate con un administrador para solucionarlo',
      );
    }

    const roles =
      userWithRoles.persona?.asignacionesRoles
        ?.filter((r) => r.activo)
        .map((r) => ({ idRol: r.rol.idRol, nombre: r.rol.nombre })) || [];

    const selectedRole = roles.find((r) => r.idRol === Number(idRol)) || null;
    if (!selectedRole) {
      throw new UnauthorizedException(
        'El rol seleccionado no es válido para este usuario',
      );
    }

    const payload = {
      username: userWithRoles.username,
      sub: userWithRoles.idUsuario,
      idPersona: userWithRoles.persona?.idPersona,
      rolId: selectedRole.idRol,
      rolNombre: selectedRole.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateOidcUser(userinfo: any): Promise<any> {
    const { preferred_username, email, sub } = userinfo;
    // Buscamos al usuario por su username de OIDC (o email)
    const user = await this.usersService.findOne(preferred_username || email);

    if (!user) {
      // Opcional: Podrías crear al usuario aquí automáticamente si no existe
      // Por ahora retornamos null para que falle si no está previamente registrado
      return null;
    }

    return user;
  }
}
