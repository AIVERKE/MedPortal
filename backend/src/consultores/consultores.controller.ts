import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    ParseIntPipe,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { ConsultoresService } from './consultores.service';
import { CreateConsultorDto } from './dto/create-consultor.dto';
import { UpdateConsultorDto } from './dto/update-consultor.dto';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Consultores')
@ApiBearerAuth()
@Controller('consultores')
export class ConsultoresController {
    constructor(private readonly consultoresService: ConsultoresService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Crear nuevo consultor' })
    @ApiResponse({
        status: 201,
        description: 'Consultor creado exitosamente.',
        type: CreateConsultorDto,
    })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Persona no encontrada.',
    })
    create(@Body() createConsultorDto: CreateConsultorDto) {
        return this.consultoresService.create(createConsultorDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los consultores' })
    @ApiResponse({ status: 200, description: 'Consultores obtenidos exitosamente.' })
    findAll() {
        return this.consultoresService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un consultor por ID' })
    @ApiResponse({ status: 200, description: 'Consultor obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Consultor no encontrado.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.consultoresService.findOne(id);
    }

    @Get('persona/:idPersona')
    @ApiOperation({ summary: 'Obtener un consultor por ID de Persona' })
    @ApiResponse({ status: 200, description: 'Consultor obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Consultor no encontrado.' })
    async findByPersona(@Param('idPersona', ParseIntPipe) idPersona: number) {
        return await this.consultoresService.findByPersona(idPersona);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Actualizar consultor existente' })
    @ApiResponse({ status: 200, description: 'Consultor actualizado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Consultor o Persona no encontrada.',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateConsultorDto: UpdateConsultorDto,
    ) {
        return this.consultoresService.update(id, updateConsultorDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Eliminar consultor' })
    @ApiResponse({ status: 200, description: 'Consultor eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Consultor no encontrado.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.consultoresService.remove(id);
    }
}
