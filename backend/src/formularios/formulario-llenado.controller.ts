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
import {
  CommitEditDto,
  CreateFormularioInstanciaDto,
  EditDraftDto,
  UpdateFormularioInstanciaDto,
} from './dto/update-formulario.dto';
import { FormulariosService } from './formularios.service';

const ALL_ROLES = [
  'SUPERUSUARIO',
  'DIRECTOR',
  'DOCTOR',
  'ESTUDIANTE',
  'DOCENTE',
  'ADMINISTRATIVO',
  'CONSULTOR',
];

const STAFF_ROLES = ['SUPERUSUARIO', 'DIRECTOR', 'DOCTOR'];

@ApiTags('Formularios - Llenado')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('formularios')
export class FormularioLlenadoController {
  constructor(private readonly formulariosService: FormulariosService) {}

  @Get('sidebar-access')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Flags de menú según permisos Ver/Llenar' })
  sidebarAccess(@Req() req: any) {
    return this.formulariosService.sidebarAccess(req.user);
  }

  @Get('para-llenar')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Listar formularios publicados disponibles para llenar/ver' })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'search', required: false })
  paraLlenar(
    @Req() req: any,
    @Query('categoria') categoria?: string,
    @Query('search') search?: string,
  ) {
    return this.formulariosService.findParaLlenar(req.user, {
      categoria,
      search,
    });
  }

  @Get('para-llenar/:id/contexto')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary: 'Contexto de llenado: borrador propio y envíos del destinatario',
  })
  @ApiQuery({ name: 'paraQuienIdUsuario', required: false })
  contextoLlenado(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Query('paraQuienIdUsuario') paraQuienIdUsuario?: string,
  ) {
    const parsed = paraQuienIdUsuario
      ? Number.parseInt(paraQuienIdUsuario, 10)
      : undefined;
    return this.formulariosService.getContextoLlenado(
      id,
      req.user,
      Number.isFinite(parsed) ? parsed : undefined,
    );
  }

  @Get('para-llenar/:id')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Detalle publicado para llenar' })
  paraLlenarDetalle(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.getFormularioParaLlenar(id, req.user);
  }

  @Get('instancias/mias')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Instancias visibles del usuario actual' })
  misInstancias(@Req() req: any) {
    return this.formulariosService.findMisInstancias(req.user);
  }

  @Get('instancias/:id')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Detalle de una instancia' })
  @ApiQuery({ name: 'version', required: false })
  getInstancia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Query('version') version?: string,
  ) {
    const versionId = version ? Number.parseInt(version, 10) : undefined;
    return this.formulariosService.findInstancia(
      id,
      req.user,
      Number.isFinite(versionId) ? versionId : undefined,
    );
  }

  @Patch('instancias/:id')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Editar una instancia (borrador de llenado)' })
  updateInstancia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormularioInstanciaDto,
    @Req() req: any,
  ) {
    return this.formulariosService.updateInstancia(id, dto, req.user);
  }

  @Post('instancias/:id/borrador-edicion')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Abrir o guardar borrador de edición' })
  saveEditDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditDraftDto,
    @Req() req: any,
  ) {
    return this.formulariosService.startOrSaveEditDraft(
      id,
      req.user,
      dto.respuestas,
    );
  }

  @Post('instancias/:id/guardar-edicion')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Publicar edición (nueva versión)' })
  commitEdit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommitEditDto,
    @Req() req: any,
  ) {
    return this.formulariosService.commitEdit(id, req.user, dto.respuestas);
  }

  @Delete('instancias/:id/borrador-edicion')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Descartar borrador de edición' })
  discardEditDraft(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.discardEditDraft(id, req.user);
  }

  @Post('instancias/:id/recuperar')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary: 'Recuperar instancia soft-deleted (auto-swap si hay cupo)',
  })
  restoreInstancia(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.restoreInstancia(id, req.user);
  }

  @Delete('instancias/:id')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Eliminar una instancia (soft delete)' })
  removeInstancia(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.formulariosService.removeInstancia(id, req.user);
  }

  @Get('pacientes-resumen')
  @Roles(...STAFF_ROLES)
  @ApiOperation({
    summary: 'Lista de pacientes con conteos de instancias por categoría',
  })
  pacientesResumen(@Req() req: any) {
    return this.formulariosService.pacientesResumen(req.user);
  }

  @Get('pacientes/:idUsuario/instancias')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Instancias visibles de un paciente' })
  @ApiQuery({ name: 'categoria', required: false })
  pacienteInstancias(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Req() req: any,
    @Query('categoria') categoria?: string,
  ) {
    return this.formulariosService.pacienteInstancias(
      idUsuario,
      req.user,
      categoria,
    );
  }

  @Post(':id/instancias')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Crear instancia (llenar formulario)' })
  createInstancia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFormularioInstanciaDto,
    @Req() req: any,
  ) {
    return this.formulariosService.createInstancia(id, dto, req.user);
  }
}
