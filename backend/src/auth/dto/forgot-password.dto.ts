import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'CI / nombre de usuario',
    example: '12345678',
  })
  @IsString()
  @MinLength(3)
  username: string;
}
