import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity';
import { AddressEntity } from './entities/address.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ServiceOrderEntity } from '../service-orders/entities/service-order.entity';
import { QuoteEntity } from '../quotes/entities/quote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity, AddressEntity, ServiceOrderEntity, QuoteEntity])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
