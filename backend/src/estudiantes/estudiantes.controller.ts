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
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';

type UploadedPdf = {
    buffer: Buffer;
    mimetype: string;
    size: number;
};

@ApiTags('Estudiantes')
@ApiBearerAuth()
@Controller('estudiantes')
export class EstudiantesController {
    constructor(private readonly estudiantesService: EstudiantesService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Crear nuevo estudiante' })
    @ApiResponse({
        status: 201,
        description: 'Estudiante creado exitosamente.',
        type: CreateEstudianteDto,
    })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Persona no encontrada.',
    })
    create(@Body() createEstudianteDto: CreateEstudianteDto) {
        return this.estudiantesService.create(createEstudianteDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los estudiantes' })
    @ApiResponse({ status: 200, description: 'Estudiantes obtenidos exitosamente.' })
    findAll() {
        return this.estudiantesService.findAll();
    }

    @Get('persona/:idPersona')
    @ApiOperation({ summary: 'Obtener un estudiante por ID de Persona' })
    @ApiResponse({ status: 200, description: 'Estudiante obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Estudiante no encontrado.' })
    async findByPersona(@Param('idPersona', ParseIntPipe) idPersona: number) {
        return await this.estudiantesService.findByPersona(idPersona);
    }

    @Patch(':id/documentos')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'pdfMatricula', maxCount: 1 },
            { name: 'pdfCarnet', maxCount: 1 },
        ]),
    )
    @ApiOperation({ summary: 'Actualizar documentos PDF de un estudiante (admin)' })
    @ApiResponse({ status: 200, description: 'Documentos actualizados exitosamente.' })
    updateDocumentos(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFiles()
        files: {
            pdfMatricula?: UploadedPdf[];
            pdfCarnet?: UploadedPdf[];
        },
    ) {
        return this.estudiantesService.updateDocumentos(
            id,
            files?.pdfMatricula?.[0],
            files?.pdfCarnet?.[0],
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un estudiante por ID' })
    @ApiResponse({ status: 200, description: 'Estudiante obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Estudiante no encontrado.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.estudiantesService.findOne(id);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Actualizar estudiante existente' })
    @ApiResponse({ status: 200, description: 'Estudiante actualizado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
    @ApiResponse({
        status: 404,
        description: 'Estudiante o Persona no encontrada.',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEstudianteDto: UpdateEstudianteDto,
    ) {
        return this.estudiantesService.update(id, updateEstudianteDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Eliminar estudiante' })
    @ApiResponse({ status: 200, description: 'Estudiante eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Estudiante no encontrado.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.estudiantesService.remove(id);
    }
}
