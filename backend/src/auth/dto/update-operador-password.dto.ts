import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateOperadorPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
