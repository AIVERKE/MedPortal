import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDoctorContactoDto {
  @ApiProperty({
    description: 'Teléfono de emergencia del doctor',
    required: false,
    example: '71234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefonoEmergencia?: string;

  @ApiProperty({
    description:
      'Si es true, los pacientes ven el teléfono de emergencia al reservar',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  compartirTelefonoEmergencia?: boolean;
}
