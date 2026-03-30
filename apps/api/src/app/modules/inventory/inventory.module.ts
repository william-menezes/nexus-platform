import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ProductEntity } from './entities/product.entity';
import { StockEntryEntity } from './entities/stock-entry.entity';
import { InventoryService } from './inventory.service';
import { NfeImportService } from './nfe-import.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, StockEntryEntity]),
    MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } }), // 5 MB
  ],
  controllers: [InventoryController],
  providers: [InventoryService, NfeImportService],
  exports: [InventoryService],
})
export class InventoryModule {}
