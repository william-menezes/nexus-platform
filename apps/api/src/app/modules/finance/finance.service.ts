import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { ReceiptPdfData } from '../pdf/pdf.interfaces';
import { SaleEntity } from './entities/sale.entity';
import { SaleItemEntity } from './entities/sale-item.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AsaasService } from './asaas.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly sales: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity)
    private readonly saleItems: Repository<SaleItemEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
    private readonly asaas: AsaasService,
  ) {}

  findAll(tenantId: string) {
    return this.sales.find({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['items', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.sales.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['items', 'payments'],
    });
    if (!sale) throw new NotFoundException(`Venda ${id} não encontrada`);
    return sale;
  }

  async create(tenantId: string, dto: CreateSaleDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calcula total
      const subtotal = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0,
      );
      const discount = dto.discountAmount ?? 0;
      const total = subtotal - discount;
      const paidAmount = dto.payments.reduce((acc, p) => acc + p.amount, 0);

      if (paidAmount > total + 0.01) {
        throw new BadRequestException(
          'Valor pago não pode ser maior que o total da venda.',
        );
      }

      // Cria a venda
      const sale = queryRunner.manager.create(SaleEntity, {
        tenantId,
        serviceOrderId: dto.serviceOrderId,
        total,
        discountAmount: discount,
        paidAmount,
        status: paidAmount >= total ? 'paid' : 'open',
      });
      await queryRunner.manager.save(sale);

      // Itens
      const items = dto.items.map((i) =>
        queryRunner.manager.create(SaleItemEntity, {
          saleId: sale.id,
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        }),
      );
      await queryRunner.manager.save(items);

      // Pagamentos + Asaas boleto
      for (const p of dto.payments) {
        let asaasChargeId: string | undefined;

        if (p.method === 'boleto') {
          const charge = await this.asaas.createBoletoCharge({
            customer: tenantId, // simplificado — em produção usar ID real do cliente
            value: p.amount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            description: `Venda ${sale.id}`,
          });
          asaasChargeId = charge?.id;
        }

        await queryRunner.manager.save(
          queryRunner.manager.create(PaymentEntity, {
            saleId: sale.id,
            method: p.method as PaymentEntity['method'],
            amount: p.amount,
            asaasChargeId,
          }),
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(tenantId, sale.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(tenantId: string, id: string) {
    const sale = await this.findOne(tenantId, id);
    if (sale.status === 'paid') {
      throw new BadRequestException('Venda já paga não pode ser cancelada.');
    }
    await this.sales.update({ id, tenantId }, { status: 'cancelled' });
    return this.findOne(tenantId, id);
  }

  async buildReceiptData(tenantId: string, id: string): Promise<ReceiptPdfData> {
    const sale = await this.findOne(tenantId, id);

    const [tenant] = await this.dataSource.query<{ name: string; phone?: string; cnpj?: string }[]>(
      `SELECT name, phone, cnpj FROM public.tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );

    let clientName: string | undefined;
    if (sale.clientId) {
      const [client] = await this.dataSource.query<{ name: string }[]>(
        `SELECT name FROM public.clients WHERE id = $1 LIMIT 1`,
        [sale.clientId],
      );
      clientName = client?.name;
    }

    const subtotal = sale.items.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0);

    return {
      tenant: { companyName: tenant?.name ?? 'Empresa', phone: tenant?.phone, cnpj: tenant?.cnpj },
      code: sale.code ?? `VND-${sale.id.slice(0, 8).toUpperCase()}`,
      createdAt: sale.createdAt,
      clientName,
      items: sale.items.map(i => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: 0,
        totalPrice: Number(i.totalPrice),
      })),
      subtotal,
      discountAmount: Number(sale.discountAmount),
      total: Number(sale.total),
      payments: sale.payments.map(p => ({ method: p.method, amount: Number(p.amount) })),
    };
  }

  // DRE — Demonstração de Resultado por período
  async getDre(tenantId: string, from: string, to: string) {
    const rows = await this.dataSource.query<
      { month: string; revenue: string; cost_of_goods: string }[]
    >(
      `
      SELECT
        TO_CHAR(s.created_at, 'YYYY-MM')      AS month,
        SUM(s.total)                           AS revenue,
        COALESCE(SUM(
          (SELECT SUM(si.quantity * p.cost_price)
           FROM sale_items si
           LEFT JOIN products p ON p.id = si.product_id
           WHERE si.sale_id = s.id)
        ), 0)                                  AS cost_of_goods
      FROM sales s
      WHERE s.tenant_id = $1
        AND s.status = 'paid'
        AND s.created_at BETWEEN $2 AND $3
      GROUP BY month
      ORDER BY month
      `,
      [tenantId, from, to],
    );

    return rows.map((r) => {
      const revenue = Number.parseFloat(r.revenue);
      const cost = Number.parseFloat(r.cost_of_goods);
      const grossProfit = revenue - cost;
      return {
        month: r.month,
        revenue,
        costOfGoods: cost,
        grossProfit,
        grossMargin: revenue > 0 ? grossProfit / revenue : 0,
      };
    });
  }
}
