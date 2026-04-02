import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCatalogEntity } from './entities/service-catalog.entity';
import { ServicesCatalogService } from './services-catalog.service';
import { ServicesCatalogController } from './services-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCatalogEntity])],
  controllers: [ServicesCatalogController],
  providers: [ServicesCatalogService],
  exports: [ServicesCatalogService],
})
export class ServicesCatalogModule {}
