import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity';
import { AddressEntity } from './entities/address.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ServiceOrderEntity } from '../service-orders/entities/service-order.entity';
import { QuoteEntity } from '../quotes/entities/quote.entity';
import { SaleEntity } from '../finance/entities/sale.entity';
import { FinancialEntryEntity } from '../financial/entities/financial-entry.entity';
import { EquipmentEntity } from '../equipments/entities/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity, AddressEntity, ServiceOrderEntity, QuoteEntity, SaleEntity, FinancialEntryEntity, EquipmentEntity])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
