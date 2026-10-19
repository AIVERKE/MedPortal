import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateFormularioDto } from './dto/update-formulario.dto';
import { FormulariosService } from './formularios.service';

@ApiTags('Formularios')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPERUSUARIO', 'DIRECTOR')
@Controller('formularios')
export class FormulariosController {
  constructor(private readonly formulariosService: FormulariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar formularios activos (admin)' })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('categoria') categoria?: string,
    @Query('search') search?: string,
  ) {
    return this.formulariosService.findAll({ categoria, search });
  }

  @Post()
  @ApiOperation({ summary: 'Crear borrador vacío' })
  create(@Req() req: any) {
    return this.formulariosService.create(
      req.user?.idPersona ?? null,
      req.user?.idUsuario ?? null,
    );
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Vista previa de borrador o versión publicada' })
  @ApiQuery({ name: 'version', required: false, enum: ['draft', 'published'] })
  preview(
    @Param('id', ParseIntPipe) id: number,
    @Query('version') version?: string,
  ) {
    const normalized = version === 'published' ? 'published' : 'draft';
    return this.formulariosService.preview(id, normalized);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle del formulario' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formulariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Guardar borrador del formulario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormularioDto,
    @Req() req: any,
  ) {
    return this.formulariosService.update(
      id,
      dto,
      req.user?.idUsuario ?? null,
    );
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publicar snapshot de llenado' })
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.publish(id, req.user?.idUsuario ?? null);
  }

  @Post(':id/revert-to-published')
  @ApiOperation({
    summary: 'Restaurar el borrador a la última versión publicada',
  })
  revertToPublished(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.revertToPublished(
      id,
      req.user?.idUsuario ?? null,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar formulario (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formulariosService.remove(id);
  }
}
