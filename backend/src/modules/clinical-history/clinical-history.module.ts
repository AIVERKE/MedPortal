import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatEnfermedad } from './entities/cat-enfermedad.entity';
import { CatAntecedenteNoPat } from './entities/cat-antecedente-no-pat.entity';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { Consulta } from './entities/consulta.entity';
import { HclExamenFisico } from './entities/hcl-examen-fisico.entity';
import { HclNoPatologico } from './entities/hcl-no-patologico.entity';
import { HclAntGo } from './entities/hcl-ant-go.entity';
import { HclPsicologiaNota } from './entities/hcl-psicologia-nota.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatEnfermedad,
      CatAntecedenteNoPat,
      HistoriaClinica,
      Consulta,
      HclExamenFisico,
      HclNoPatologico,
      HclAntGo,
      HclPsicologiaNota,
    ]),
  ],
  controllers: [],
  providers: [],
})
export class ClinicalHistoryModule {}
