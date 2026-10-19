import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionReservaConsulta } from '../modules/appointments/entities/configuracion-reserva-consulta.entity';
import { CreateConfiguration } from './dto/create-configuration/create-configuration';

@Injectable()
export class ConfiguracionReservasConsultasService {
  constructor(
    @InjectRepository(ConfiguracionReservaConsulta)
    private readonly configRepository: Repository<ConfiguracionReservaConsulta>,
  ) {}

  // Method to save a new configuration
  // Este es el método que guarda en la base de datos la configuración recibida
  async create(data: CreateConfiguration) {
    // 1. Creamos una instancia de la entidad con los datos del DTO
    const newConfiguration = this.configRepository.create(data);

    // 2. Guardamos la nueva configuración en la base de datos Postgres
    return await this.configRepository.save(newConfiguration);
  }

  // Method to find a configuration by its ID
  async findOne(id: number) {
    const config = await this.configRepository.findOneBy({
      idConfiguracionReservasMedicas: id,
    });
    if (!config) {
      throw new NotFoundException(
        'Configuración con ID ' + id + ' no encontrada.',
      );
    }
    return config;
  }
  // Method to retrieve all configurations
  async findAll() {
    // 1. Buscamos todas las configuraciones en el repositorio
    return await this.configRepository.find();
  }

  // Method to update an existing configuration
  async update(id: number, data: Partial<CreateConfiguration>) {
    // 1. Buscamos la configuración para asegurarnos de que existe y cargarla.
    const config = await this.findOne(id);

    // 2. Fusionamos los datos del DTO con la entidad cargada.
    const updatedConfig = this.configRepository.merge(config, data);

    // 3. Guardamos la entidad actualizada y la retornamos.
    // TypeORM se encarga de hacer el UPDATE solo con los campos que cambiaron.
    return this.configRepository.save(updatedConfig);
  }

  // Method to delete a configuration by its ID
  async remove(id: number) {
    // 1. Buscamos la configuración antes de eliminarla.
    const config = await this.findOne(id);

    // 2. Utilizamos softRemove para eliminar la configuración.
    return await this.configRepository.softRemove(config);
  }
}
