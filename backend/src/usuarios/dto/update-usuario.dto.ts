import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
    @ApiProperty({ description: 'Indica si el usuario está bloqueado', required: false })
    @IsBoolean()
    @IsOptional()
    bloqueado?: boolean;
}
