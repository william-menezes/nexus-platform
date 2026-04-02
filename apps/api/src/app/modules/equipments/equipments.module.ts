import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentTypeEntity } from './entities/equipment-type.entity';
import { EquipmentEntity } from './entities/equipment.entity';
import { EquipmentsService } from './equipments.service';
import { EquipmentTypesController, EquipmentsController } from './equipments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentTypeEntity, EquipmentEntity])],
  controllers: [EquipmentTypesController, EquipmentsController],
  providers: [EquipmentsService],
  exports: [EquipmentsService],
})
export class EquipmentsModule {}
