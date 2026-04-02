import { IsOptional, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindEquiposDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El id debe ser un numero entero' })
  @Min(1, { message: 'El id debe ser mayor o igual a 1' })
  id?: number;

  @IsOptional()
  @IsIn(['Electrica', 'Neumatica', 'Electronica', 'ELECTRICA', 'NEUMATICA', 'MECANICA'], {
    message: 'Sector invalido. Valores permitidos: Electrica, Neumatica, Electronica',
  })
  sector?: string;

  @IsOptional()
  @IsIn(['Activo', 'Inactivo', 'EnMantenimiento', 'En mantenimiento', 'ACTIVO', 'INACTIVO', 'MANTENIMIENTO'], {
    message: 'Estado invalido. Valores permitidos: Activo, Inactivo, En mantenimiento',
  })
  estado?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La ubicacion debe ser texto' })
  ubicacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un numero entero' })
  @Min(1, { message: 'La pagina debe ser mayor o igual a 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero entero' })
  @Min(1, { message: 'El limite debe ser mayor o igual a 1' })
  limit?: number;
}
