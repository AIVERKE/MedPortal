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
import { DocentesService } from './docentes.service';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Docentes')
@ApiBearerAuth()
@Controller('docentes')
export class DocentesController {
    constructor(private readonly docentesService: DocentesService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Crear nuevo docente' })
    @ApiResponse({
        status: 201,
        description: 'Docente creado exitosamente.',
        type: CreateDocenteDto,
    })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Persona no encontrada.',
    })
    create(@Body() createDocenteDto: CreateDocenteDto) {
        return this.docentesService.create(createDocenteDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los docentes' })
    @ApiResponse({ status: 200, description: 'Docentes obtenidos exitosamente.' })
    findAll() {
        return this.docentesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un docente por ID' })
    @ApiResponse({ status: 200, description: 'Docente obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Docente no encontrado.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.docentesService.findOne(id);
    }

    @Get('persona/:idPersona')
    @ApiOperation({ summary: 'Obtener un docente por ID de Persona' })
    @ApiResponse({ status: 200, description: 'Docente obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Docente no encontrado.' })
    async findByPersona(@Param('idPersona', ParseIntPipe) idPersona: number) {
        return await this.docentesService.findByPersona(idPersona);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Actualizar docente existente' })
    @ApiResponse({ status: 200, description: 'Docente actualizado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Docente o Persona no encontrada.',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDocenteDto: UpdateDocenteDto,
    ) {
        return this.docentesService.update(id, updateDocenteDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Eliminar docente' })
    @ApiResponse({ status: 200, description: 'Docente eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Docente no encontrado.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.docentesService.remove(id);
    }
}
