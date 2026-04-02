import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartOfAccountEntity } from './entities/chart-of-account.entity';
import { CostCenterEntity } from './entities/cost-center.entity';
import { FinancialEntryEntity } from './entities/financial-entry.entity';
import { InstallmentEntity } from './entities/installment.entity';
import { CashRegisterEntity } from './entities/cash-register.entity';
import { CashSessionEntity } from './entities/cash-session.entity';
import { CashMovementEntity } from './entities/cash-movement.entity';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChartOfAccountEntity,
      CostCenterEntity,
      FinancialEntryEntity,
      InstallmentEntity,
      CashRegisterEntity,
      CashSessionEntity,
      CashMovementEntity,
    ]),
  ],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
