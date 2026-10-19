import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los roles' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un rol por ID' })
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(+id);
    }

    @Post()
    @Roles('SUPERUSUARIO')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Crear un nuevo rol (Solo SUPERUSUARIO)' })
    create(@Body() data: any) {
        return this.rolesService.create(data);
    }

    @Patch(':id')
    @Roles('SUPERUSUARIO')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Actualizar un rol (Solo SUPERUSUARIO)' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.rolesService.update(+id, data);
    }

    @Delete(':id')
    @Roles('SUPERUSUARIO')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Eliminar un rol (Solo SUPERUSUARIO)' })
    remove(@Param('id') id: string) {
        return this.rolesService.remove(+id);
    }
}
