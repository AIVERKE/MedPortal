import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckUsernameQueryDto {
  @ApiProperty({ example: 'juan.perez', description: 'Nombre de usuario a verificar' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
