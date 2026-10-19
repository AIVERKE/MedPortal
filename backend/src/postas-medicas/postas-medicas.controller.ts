import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePostaMedica } from './dto/create-posta-medica/create-posta-medica';
import { PostasMedicasService } from './postas-medicas.service';

@ApiTags('Postas Médicas')
@Controller('postas-medicas')
export class PostasMedicasController {
  constructor(private readonly postasMedicasService: PostasMedicasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new medical posta' })
  @ApiResponse({
    status: 201,
    description: 'Medical posta created successfully',
  })
  async create(@Body() data: CreatePostaMedica) {
    return await this.postasMedicasService.create(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a medical posta by ID' })
  @ApiResponse({ status: 200, description: 'Medical posta found successfully' })
  async findOne(@Param('id') id: number) {
    const posta = await this.postasMedicasService.findOne(id);
    if (!posta) throw new NotFoundException('Medical posta not found');
    return posta;
  }

  @Get()
  @ApiOperation({ summary: 'Find all medical postas' })
  @ApiResponse({
    status: 200,
    description: 'All medical postas retrieved successfully',
  })
  async findAll() {
    return await this.postasMedicasService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a medical posta by ID' })
  @ApiResponse({
    status: 200,
    description: 'Medical posta updated successfully',
  })
  async update(
    @Param('id') id: number,
    @Body() data: Partial<CreatePostaMedica>,
  ) {
    const updatedPosta = await this.postasMedicasService.update(id, data);
    if (!updatedPosta) throw new NotFoundException('Medical posta not found');
    return updatedPosta;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a medical posta by ID' })
  @ApiResponse({
    status: 200,
    description: 'Medical posta deleted successfully',
  })
  async remove(@Param('id') id: number) {
    const result = await this.postasMedicasService.remove(id);
    if (!result) throw new NotFoundException('Medical posta not found');
    return { message: 'Posta médica eliminada exitosamente.' };
  }

  @Get('especialidad/:id_especialidad')
  @ApiOperation({ summary: 'Busca las postas medicas por especialidad' })
  @ApiResponse({ status: 200, description: 'Postas encontradas' })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron postas médicas para la especialidad',
  })
  async findByEspecialidad(
    @Param('id_especialidad', ParseIntPipe) id_especialidad: number,
  ) {
    return await this.postasMedicasService.findByEspecialidad(id_especialidad);
  }

  @Get(':id/consultorios')
  @ApiOperation({ summary: 'Obtener consultorios de una posta médica' })
  @ApiResponse({
    status: 200,
    description: 'Consultorios encontrados exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Posta médica no encontrada' })
  async getConsultoriosByPosta(@Param('id', ParseIntPipe) id: number) {
    return await this.postasMedicasService.findConsultorios(id);
  }
}
