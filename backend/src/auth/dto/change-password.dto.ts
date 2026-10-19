import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  newPassword: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsString()
  confirmPassword: string;
}
