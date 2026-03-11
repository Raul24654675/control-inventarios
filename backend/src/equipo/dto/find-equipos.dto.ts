import { IsOptional, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Sector, Estado } from '@prisma/client';

export class FindEquiposDto {
  @IsOptional()
  @IsIn(['ELECTRICA', 'NEUMATICA', 'MECANICA'])
  sector?: Sector;

  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'])
  estado?: Estado;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
