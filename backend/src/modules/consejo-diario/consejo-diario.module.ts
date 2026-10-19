import { Module } from '@nestjs/common';
import { ConsejoDiarioService } from './consejo-diario.service';
import { ConsejoDiarioController } from './consejo-diario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsejoDiario } from './entities/consejo-diario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsejoDiario])],
  controllers: [ConsejoDiarioController],
  providers: [ConsejoDiarioService],
})
export class ConsejoDiarioModule {}
