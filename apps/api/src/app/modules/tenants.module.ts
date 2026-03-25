import { Module } from '@nestjs/common';
import { ServiceOrdersModule } from './service-orders.module';

@Module({
  imports: [ServiceOrdersModule],
})
export class TenantsModule {}
