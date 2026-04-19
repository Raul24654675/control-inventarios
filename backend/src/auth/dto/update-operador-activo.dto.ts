import { IsBoolean } from 'class-validator';

export class UpdateOperadorActivoDto {
  @IsBoolean()
  activo!: boolean;
}
