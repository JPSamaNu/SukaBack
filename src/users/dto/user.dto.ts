import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email único del usuario',
    example: 'usuario@sukadex.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'miPassword123',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email único del usuario',
    example: 'nuevo@sukadex.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 6 caracteres)',
    example: 'nuevaPassword123',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @MinLength(6)
  password?: string;
}