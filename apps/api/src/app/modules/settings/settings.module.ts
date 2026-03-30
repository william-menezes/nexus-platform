import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomStatusEntity } from './entities/custom-status.entity';
import { TenantSettingsEntity } from './entities/tenant-settings.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { PermissionEntity } from './entities/permission.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomStatusEntity,
      TenantSettingsEntity,
      AuditLogEntity,
      PermissionEntity,
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
