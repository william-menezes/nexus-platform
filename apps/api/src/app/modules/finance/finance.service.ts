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

      // Pagamentos: processar boletos externos sequencialmente, depois salvar tudo em lote
      const paymentEntities: PaymentEntity[] = [];
      for (const p of dto.payments) {
        let asaasChargeId: string | undefined;
        if (p.method === 'boleto') {
          const charge = await this.asaas.createBoletoCharge({
            customer: tenantId,
            value: p.amount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Venda ${sale.id}`,
          });
          asaasChargeId = charge?.id;
        }
        paymentEntities.push(
          queryRunner.manager.create(PaymentEntity, {
            saleId: sale.id,
            method: p.method as PaymentEntity['method'],
            amount: p.amount,
            asaasChargeId,
          }),
        );
      }
      await queryRunner.manager.save(paymentEntities);

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

    const [tenant] = await this.dataSource.query<{ name: string; phone?: string; cnpj?: string; logo_url?: string }[]>(
      `SELECT name, phone, cnpj, logo_url FROM public.tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );

    let logoUrl: string | undefined;
    if (tenant?.logo_url) {
      try {
        const res = await fetch(tenant.logo_url);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get('content-type') ?? 'image/png';
          logoUrl = `data:${mime};base64,${buf.toString('base64')}`;
        }
      } catch { /* logo falhou silenciosamente */ }
    }

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
      tenant: { companyName: tenant?.name ?? 'Empresa', phone: tenant?.phone, cnpj: tenant?.cnpj, logoUrl },
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

  async getReportByProduct(tenantId: string, from: string, to: string) {
    const rows = await this.dataSource.query<{
      product_id: string; product_name: string;
      total_quantity: string; total_revenue: string; total_cost: string;
    }[]>(
      `SELECT
         p.id                                               AS product_id,
         p.name                                             AS product_name,
         SUM(si.quantity)::numeric                          AS total_quantity,
         SUM(si.total_price)::numeric                       AS total_revenue,
         COALESCE(SUM(si.quantity * p.cost_price), 0)::numeric AS total_cost
       FROM sale_items si
       JOIN products p  ON p.id  = si.product_id
       JOIN sales s     ON s.id  = si.sale_id
       WHERE s.tenant_id = $1
         AND s.status    = 'paid'
         AND s.created_at BETWEEN $2 AND $3
         AND si.product_id IS NOT NULL
       GROUP BY p.id, p.name
       ORDER BY total_revenue DESC`,
      [tenantId, from, to],
    );
    return rows.map(r => {
      const revenue = Number(r.total_revenue);
      const cost    = Number(r.total_cost);
      return {
        productId:     r.product_id,
        productName:   r.product_name,
        totalQuantity: Number(r.total_quantity),
        totalRevenue:  revenue,
        totalCost:     cost,
        grossProfit:   revenue - cost,
        grossMargin:   revenue > 0 ? (revenue - cost) / revenue : 0,
      };
    });
  }

  async getReportByEmployee(tenantId: string, from: string, to: string) {
    const rows = await this.dataSource.query<{
      employee_id: string | null; employee_name: string;
      sales_count: string; total_revenue: string;
    }[]>(
      `SELECT
         e.id::text                       AS employee_id,
         COALESCE(e.name, 'Sem vínculo')  AS employee_name,
         COUNT(DISTINCT s.id)::int        AS sales_count,
         SUM(s.total)::numeric            AS total_revenue
       FROM sales s
       LEFT JOIN employees e ON e.id = s.employee_id
       WHERE s.tenant_id = $1
         AND s.status    = 'paid'
         AND s.created_at BETWEEN $2 AND $3
       GROUP BY e.id, e.name
       ORDER BY total_revenue DESC`,
      [tenantId, from, to],
    );
    return rows.map(r => ({
      employeeId:   r.employee_id ?? null,
      employeeName: r.employee_name,
      salesCount:   Number(r.sales_count),
      totalRevenue: Number(r.total_revenue),
    }));
  }

  async getReportByPaymentMethod(tenantId: string, from: string, to: string) {
    const rows = await this.dataSource.query<{
      method: string; count: string; total_amount: string;
    }[]>(
      `SELECT
         p.method,
         COUNT(*)::int          AS count,
         SUM(p.amount)::numeric AS total_amount
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE s.tenant_id = $1
         AND s.status    = 'paid'
         AND s.created_at BETWEEN $2 AND $3
       GROUP BY p.method
       ORDER BY total_amount DESC`,
      [tenantId, from, to],
    );
    const methodLabels: Record<string, string> = {
      cash: 'Dinheiro', credit: 'Cartão de Crédito', debit: 'Cartão de Débito',
      pix: 'PIX', boleto: 'Boleto', transfer: 'Transferência',
    };
    const grandTotal = rows.reduce((s, r) => s + Number(r.total_amount), 0);
    return rows.map(r => ({
      method:      r.method,
      methodLabel: methodLabels[r.method] ?? r.method,
      count:       Number(r.count),
      totalAmount: Number(r.total_amount),
      percentage:  grandTotal > 0 ? Number(r.total_amount) / grandTotal : 0,
    }));
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
