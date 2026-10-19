import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AsignacionRolesService } from './asignacion-roles.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Asignación de Roles')
@ApiBearerAuth()
@Controller('asignacion-roles')
export class AsignacionRolesController {
    constructor(
        private readonly asignacionRolesService: AsignacionRolesService,
    ) { }

    @Post()
    @Roles('SUPERUSUARIO', 'DIRECTOR')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Asignar o actualizar rol a una persona' })
    async assignRole(
        @Body() data: { idPersona: number; idRol: number; active: boolean },
        @Request() req: any,
    ) {
        return await this.asignacionRolesService.assignRole(
            data.idPersona,
            data.idRol,
            data.active,
            req.user.rol,
        );
    }

    @Get(':idPersona')
    @Roles('SUPERUSUARIO', 'DIRECTOR')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Obtener roles asignados a una persona' })
    async findByPersona(@Param('idPersona') idPersona: string) {
        return await this.asignacionRolesService.findByPersona(+idPersona);
    }
}
