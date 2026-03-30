import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleEntity } from './entities/sale.entity';
import { SaleItemEntity } from './entities/sale-item.entity';
import { PaymentEntity } from './entities/payment.entity';
import { FinanceService } from './finance.service';
import { AsaasService } from './asaas.service';
import { WhatsappService } from './whatsapp.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SaleEntity, SaleItemEntity, PaymentEntity])],
  controllers: [FinanceController],
  providers: [FinanceService, AsaasService, WhatsappService],
})
export class FinanceModule {}
