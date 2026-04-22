import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { normalizePostgresUrl } from './core/database/normalize-postgres-url';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = normalizePostgresUrl(config.get<string>('DATABASE_URL'));
        if (!url) {
          throw new Error('Missing required env var: DATABASE_URL');
        }

        try {
          // Ensure we fail fast with a clear message (and without leaking credentials).
          // eslint-disable-next-line no-new
          new URL(url);
        } catch {
          throw new Error(
            "Invalid DATABASE_URL. If you're using a `.env` file and your password contains `#`, wrap the whole value in quotes (dotenv treats `#` as a comment). Also URL-encode special characters (e.g. # -> %23, / -> %2F).",
          );
        }

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          synchronize: false,
          ssl: { rejectUnauthorized: false },
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
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
