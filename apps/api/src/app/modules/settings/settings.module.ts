import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomStatusEntity } from './entities/custom-status.entity';
import { TenantSettingsEntity } from './entities/tenant-settings.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { PermissionEntity } from './entities/permission.entity';
import { ItemCategoryEntity } from './entities/item-category.entity';
import { ItemBrandEntity } from './entities/item-brand.entity';
import { ItemQualityEntity } from './entities/item-quality.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CatalogSettingsController } from './catalog-settings.controller';
import { CatalogSettingsService } from './catalog-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomStatusEntity,
      TenantSettingsEntity,
      AuditLogEntity,
      PermissionEntity,
      ItemCategoryEntity,
      ItemBrandEntity,
      ItemQualityEntity,
    ]),
  ],
  controllers: [SettingsController, CatalogSettingsController],
  providers: [SettingsService, CatalogSettingsService],
  exports: [SettingsService, CatalogSettingsService],
})
export class SettingsModule {}
