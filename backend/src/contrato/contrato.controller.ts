import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { CreateContrato } from './dto/create-contrato/create-contrato';
import { UpdateContrato } from './dto/update-contrato/update-contrato.dto';

type UploadedPdf = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@ApiTags('Contratos')
@Controller('contrato')
export class ContratoController {
  constructor(private readonly contratoService: ContratoService) {}

  @ApiOperation({ summary: 'Crear nuevo contrato' })
  @ApiResponse({ status: 201, description: 'Contrato creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  @UseInterceptors(FileInterceptor('pdfContrato'))
  create(
    @Req() req,
    @Body() createContratoDto: CreateContrato,
    @UploadedFile() pdfContrato?: UploadedPdf,
  ) {
    return this.contratoService.create(
      createContratoDto,
      req.user,
      pdfContrato,
    );
  }

  @ApiOperation({ summary: 'Obtener todos los contratos' })
  @ApiResponse({
    status: 200,
    description: 'Contratos obtenidos exitosamente.',
    type: [CreateContrato],
  })
  @ApiResponse({ status: 404, description: 'No se encontraron contratos.' })
  @Get()
  findAll(@Req() req) {
    return this.contratoService.findAll(req.user);
  }

  @ApiOperation({ summary: 'Obtener contratos por ID de Persona' })
  @ApiResponse({ status: 200, description: 'Contratos obtenidos exitosamente.' })
  @Get('persona/:idPersona')
  findByPersona(
    @Req() req,
    @Param('idPersona', ParseIntPipe) idPersona: number,
  ) {
    return this.contratoService.findByPersona(idPersona, req.user);
  }

  @ApiOperation({ summary: 'Obtener contrato por ID' })
  @ApiResponse({
    status: 200,
    description: 'Contrato obtenido exitosamente.',
    type: CreateContrato,
  })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado.' })
  @Get(':id')
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.contratoService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Actualizar contrato existente' })
  @ApiResponse({
    status: 200,
    description: 'Contrato actualizado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  @UseInterceptors(FileInterceptor('pdfContrato'))
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratoDto: UpdateContrato,
    @UploadedFile() pdfContrato?: UploadedPdf,
  ) {
    return this.contratoService.update(
      id,
      updateContratoDto,
      req.user,
      pdfContrato,
    );
  }

  @ApiOperation({ summary: 'Eliminar contrato por ID' })
  @ApiResponse({ status: 200, description: 'Contrato eliminado exitosamente.' })
  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.contratoService.remove(id, req.user);
  }
}
