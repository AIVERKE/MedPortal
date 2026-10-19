import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Personas')
@ApiBearerAuth()
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Crear nueva persona' })
  @ApiResponse({
    status: 201,
    description: 'Persona creada exitosamente.',
    type: CreatePersonaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta o CI duplicado.',
  })
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(createPersonaDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener todas las personas' })
  @ApiResponse({
    status: 200,
    description: 'Personas obtenidas exitosamente.',
  })
  findAll() {
    return this.personasService.findAll();
  }

  @Get('sin-usuario')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener todas las personas sin cuenta de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Personas sin usuario obtenidas exitosamente.',
  })
  findSinUsuario() {
    return this.personasService.findSinUsuario();
  }

  @Get('con-usuario')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener todas las personas con cuenta de usuario activa' })
  @ApiResponse({
    status: 200,
    description: 'Personas con usuario obtenidas exitosamente.',
  })
  findConUsuario() {
    return this.personasService.findConUsuario();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener una persona por ID' })
  @ApiResponse({ status: 200, description: 'Persona obtenida exitosamente.' })
  @ApiResponse({ status: 404, description: 'Persona no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Actualizar persona existente' })
  @ApiResponse({
    status: 200,
    description: 'Persona actualizada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta o CI duplicado.',
  })
  @ApiResponse({ status: 404, description: 'Persona no encontrada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ) {
    return this.personasService.update(id, updatePersonaDto);
  }

  @Delete(':id')
  @Roles('SUPERUSUARIO')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Eliminar persona' })
  @ApiResponse({ status: 200, description: 'Persona eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Persona no encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Actualizar estado de persona (activo/inactivo)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.personasService.updateStatus(id, activo);
  }

  @Patch(':id/foto')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FileInterceptor('foto'))
  @ApiOperation({ summary: 'Actualizar foto de perfil de una persona' })
  @ApiResponse({ status: 200, description: 'Foto actualizada exitosamente.' })
  updateFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname?: string;
    },
  ) {
    return this.personasService.updateFoto(id, file);
  }
}
