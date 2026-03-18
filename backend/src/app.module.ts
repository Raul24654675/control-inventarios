
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistorialModule } from './historial/historial.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EquipoModule } from './equipo/equipo.module';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EquipoModule,
    HistorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
