import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TenantMiddleware } from './core/middleware/tenant.middleware';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';
import { SnakeNamingStrategy } from './core/database/snake-naming.strategy';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ServicesCatalogModule } from './modules/services-catalog/services-catalog.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { FinancialModule } from './modules/financial/financial.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      ssl: { rejectUnauthorized: false },
      namingStrategy: new SnakeNamingStrategy(),
    }),
    ServiceOrdersModule,
    InventoryModule,
    FinanceModule,
    ClientsModule,
    SettingsModule,
    EmployeesModule,
    ServicesCatalogModule,
    EquipmentsModule,
    QuotesModule,
    FinancialModule,
    SuppliersModule,
    AuthModule,
    AdminModule,
    ContractsModule,
    ReturnsModule,
    PurchaseOrdersModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
