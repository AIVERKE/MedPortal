import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { Issuer, Client } from 'openid-client';
import { OidcStrategy } from './strategies/oidc.strategy';
import { RegistroEstudianteService } from './registro-estudiante.service';
import { RegistroPersonalService } from './registro-personal.service';
import { AccountService } from './account.service';
import { CuentaRolService } from './cuenta-rol.service';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Docente } from '../modules/users/entities/docente.entity';
import { Administrativo } from '../modules/users/entities/administrativo.entity';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { ContratoConsultor } from '../modules/users/entities/contrato-consultor.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailModule } from '../modules/mail/mail.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    TypeOrmModule.forFeature([
      Facultad,
      Carrera,
      Persona,
      Estudiante,
      Usuario,
      Rol,
      AsignacionRol,
      Docente,
      Administrativo,
      Consultor,
      ContratoConsultor,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') ||
            '1d') as any, // Default a 1 día si no está definido
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountService,
    CuentaRolService,
    RegistroEstudianteService,
    RegistroPersonalService,
    JwtStrategy,
    OidcStrategy,
    {
      provide: 'OIDC_CLIENT',
      useFactory: async (
        configService: ConfigService,
      ): Promise<Client | null> => {
        const issuerUrl = configService.get<string>('OIDC_ISSUER');
        const clientId = configService.get<string>('OIDC_CLIENT_ID');

        // Si la configuración OIDC tiene valores placeholder o está vacía, no intentar conectar
        if (
          !issuerUrl ||
          issuerUrl.includes('your-realm') ||
          !clientId ||
          clientId === 'your-client-id'
        ) {
          console.warn(
            '[AuthModule] OIDC no configurado: cliente OIDC deshabilitado.',
          );
          return null;
        }

        try {
          const issuer = await Issuer.discover(issuerUrl);
          const client = new issuer.Client({
            client_id: clientId,
            client_secret: configService.get<string>('OIDC_CLIENT_SECRET'),
            redirect_uris: [
              configService.get<string>('OIDC_REDIRECT_URI') || '',
            ],
            post_logout_redirect_uris: [
              configService.get<string>('OIDC_POST_LOGOUT_REDIRECT_URI') || '',
            ],
            response_types: ['code'],
          });
          return client;
        } catch (err) {
          console.error(
            `[AuthModule] Error al descubrir el issuer OIDC (${issuerUrl}): ${err.message}. OIDC deshabilitado.`,
          );
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [JwtStrategy, PassportModule, AuthService, 'OIDC_CLIENT'],
})
export class AuthModule {}
