import { Module } from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { EquipoController } from './equipo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 🔥 ESTA LÍNEA ES LA CLAVE
  controllers: [EquipoController],
  providers: [EquipoService],
})
export class EquipoModule {}