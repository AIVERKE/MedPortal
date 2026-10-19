import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(AsignacionRol)
    private readonly asignacionRolRepository: Repository<AsignacionRol>,
    @InjectRepository(Facultad)
    private readonly facultadRepository: Repository<Facultad>,
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
  ) { }

  async onModuleInit() {
    try {
      await this.seedCatalogosAcademicos();
    } catch (error) {
      console.error(
        '[SeedService] No se pudieron sembrar catálogos académicos. Ejecuta las migraciones pendientes.',
        error?.message || error,
      );
    }
    await this.seedUsers();
  }

  async seedCatalogosAcademicos() {
    const catalogos = [
      {
        facultad: 'Facultad de Medicina',
        carreras: ['Medicina', 'Enfermería', 'Odontología', 'Nutrición'],
      },
      {
        facultad: 'Facultad de Ciencias Farmacéuticas y Bioquímicas',
        carreras: ['Bioquímica', 'Farmacia'],
      },
      {
        facultad: 'Facultad de Ciencias Puras y Naturales',
        carreras: ['Física', 'Matemática', 'Biología', 'Informática'],
      },
      {
        facultad: 'Facultad de Tecnología',
        carreras: ['Ingeniería Electrónica', 'Ingeniería Mecánica'],
      },
    ];

    for (const item of catalogos) {
      let facultad = await this.facultadRepository.findOne({
        where: { nombre: item.facultad },
        withDeleted: true,
      });

      if (!facultad) {
        facultad = await this.facultadRepository.save(
          this.facultadRepository.create({ nombre: item.facultad, activo: true }),
        );
      } else if (facultad.deletedAt || !facultad.activo) {
        facultad.deletedAt = null as any;
        facultad.activo = true;
        facultad = await this.facultadRepository.save(facultad);
      }

      for (const nombreCarrera of item.carreras) {
        const carrera = await this.carreraRepository.findOne({
          where: {
            nombre: nombreCarrera,
            facultad: { idFacultad: facultad.idFacultad },
          },
          relations: ['facultad'],
          withDeleted: true,
        });

        if (!carrera) {
          await this.carreraRepository.save(
            this.carreraRepository.create({
              nombre: nombreCarrera,
              facultad,
              activo: true,
            }),
          );
          continue;
        }

        if (carrera.deletedAt || !carrera.activo) {
          carrera.deletedAt = null as any;
          carrera.activo = true;
          await this.carreraRepository.save(carrera);
        }
      }
    }
  }

  async seedUsers() {
    // 1. Gestionar Todos los Roles Maestros
    const rolesToSeed = [
      'SUPERUSUARIO',
      'ESTUDIANTE',
      'DOCENTE',
      'ADMINISTRATIVO',
      'CONSULTOR',
      'DIRECTOR',
      'DOCTOR',
    ];

    const rolesMap: { [key: string]: Rol } = {};

    for (const nombreRol of rolesToSeed) {
      let rol = await this.rolRepository.findOne({ where: { nombre: nombreRol } });
      if (!rol) {
        rol = this.rolRepository.create({ nombre: nombreRol });
        rol = await this.rolRepository.save(rol);
      }
      rolesMap[nombreRol] = rol;
    }

    const usersCount = await this.usuarioRepository.count();
    if (usersCount > 0) {
      console.log('La base de datos ya tiene usuarios, saltando seed de usuarios...');
      return;
    }

    console.log('Insertando datos de semilla (Admin)...');

    // 2. Crear Persona
    const persona = this.personaRepository.create({
      ci: '0000000',
      nombres: 'Admin',
      primerApellido: 'Principal',
      email: 'admin@sadc.com',
    });
    const savedPersona = await this.personaRepository.save(persona);

    // 3. Crear Asignación de Rol
    const superUsuarioRol = rolesMap['SUPERUSUARIO'];
    const asignacion = this.asignacionRolRepository.create({
      persona: savedPersona,
      rol: superUsuarioRol,
    });
    await this.asignacionRolRepository.save(asignacion);

    // 4. Crear Usuario
    const hashedPassword = await bcrypt.hash('password123', 10);
    const usuario = this.usuarioRepository.create({
      persona: savedPersona,
      username: 'admin',
      password: hashedPassword,
    });
    await this.usuarioRepository.save(usuario);

    console.log('Admin creado exitosamente: admin / password123');
  }
}
