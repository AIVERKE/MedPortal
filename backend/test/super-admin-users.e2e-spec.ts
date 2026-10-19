import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersAdminController } from '../src/super-admin/controllers/users-admin.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/modules/users/users.service';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersAdminService } from '../src/super-admin/services/users-admin.service';
import {
  PersonaAdminService,
  EstudianteAdminService,
  DocenteAdminService,
  ConsultorAdminService,
  AdministrativoAdminService,
  RolAdminService,
  HistorialUsuarioAdminService,
  ContratoConsultorAdminService,
} from '../src/super-admin/services/users-domain-services';
import { AuditLogInterceptor } from '../src/super-admin/interceptors/audit-log.interceptor';

describe('UsersAdminController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockUser = {
    idUsuario: 1,
    username: 'admin',
    persona: {
      nombres: 'Admin',
      roles: [{ tipoRol: 'SuperUsuario' }],
    },
  };

  const mockNormalUser = {
    idUsuario: 2,
    username: 'user',
    persona: {
      nombres: 'User',
      roles: [{ tipoRol: 'USUARIO' }],
    },
  };

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  const mockRepository = {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'secret',
            signOptions: { expiresIn: '1d' },
          }),
        }),
      ],
      controllers: [UsersAdminController],
      providers: [
        AuthService,
        JwtStrategy,
        UsersAdminService,
        PersonaAdminService,
        EstudianteAdminService,
        DocenteAdminService,
        ConsultorAdminService,
        AdministrativoAdminService,
        RolAdminService,
        HistorialUsuarioAdminService,
        ContratoConsultorAdminService,
        AuditLogInterceptor,
        { provide: UsersService, useValue: mockUsersService },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/usuario.entity').Usuario,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/persona.entity').Persona,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/rol.entity').Rol,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/estudiante.entity')
              .Estudiante,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/docente.entity').Docente,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/consultor.entity').Consultor,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/administrativo.entity')
              .Administrativo,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/historial-usuario.entity')
              .HistorialUsuario,
          ),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(
            require('../src/modules/users/entities/contrato-consultor.entity')
              .ContratoConsultor,
          ),
          useValue: mockRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Property 1: JWT Authentication Required', () => {
    it('should return 401 Unauthorized when no token is provided', () => {
      return request(app.getHttpServer())
        .get('/super-admin/users/usuarios')
        .expect(401);
    });
  });

  describe('Property 2: SuperUsuario Authorization Required', () => {
    it('should return 403 Forbidden when user does not have SuperUsuario role', async () => {
      const token = jwtService.sign({ username: 'user', sub: 2 });
      mockUsersService.findOneById.mockResolvedValue(mockNormalUser);

      return request(app.getHttpServer())
        .get('/super-admin/users/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should grant access when user has SuperUsuario role', async () => {
      const token = jwtService.sign({ username: 'admin', sub: 1 });
      mockUsersService.findOneById.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .get('/super-admin/users/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
