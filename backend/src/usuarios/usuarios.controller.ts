import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo usuario' })
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los usuarios' })
    findAll() {
        return this.usuariosService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un usuario por ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un usuario' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
    ) {
        return this.usuariosService.update(id, updateUsuarioDto);
    }

    @Get('persona/:idPersona')
    @ApiOperation({ summary: 'Obtener un usuario por ID de persona' })
    findByPersona(@Param('idPersona', ParseIntPipe) idPersona: number) {
        return this.usuariosService.findOneByPersona(idPersona);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.remove(id);
    }
}
