import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { ServiceOrderEntity } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto, ChangeStatusDto } from './dto/update-service-order.dto';
import { OsPdfData } from '../pdf/pdf.interfaces';

const PLAN_LIMITS: Record<string, number> = {
  trial: 20,
  starter: 100,
  pro: 1000,
  enterprise: Infinity,
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrderEntity)
    private readonly repo: Repository<ServiceOrderEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string) {
    return this.repo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const os = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!os) throw new NotFoundException(`OS ${id} não encontrada`);
    return os;
  }

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    const count = await this.repo.count({
      where: { tenantId, deletedAt: IsNull() },
    });
    const [tenant] = await this.dataSource.query<{ plan: string; plan_limits: { max_os: number } }[]>(
      `SELECT plan, plan_limits FROM public.tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );
    const planKey = tenant?.plan ?? 'starter';
    const maxOs = tenant?.plan_limits?.max_os ?? PLAN_LIMITS[planKey] ?? PLAN_LIMITS['starter'];
    const limit = PLAN_LIMITS[planKey] ?? maxOs;
    if (count >= limit) {
      throw new HttpException(
        {
          message: `Limite de ${limit} OS atingido. Faça upgrade do plano.`,
          upgradeUrl: '/pricing',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const code = `OS-${Date.now().toString(36).toUpperCase()}`;
    return this.repo.save({ ...dto, tenantId, code });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceOrderDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as unknown as Partial<ServiceOrderEntity>);
    return this.findOne(tenantId, id);
  }

  async changeStatus(tenantId: string, id: string, dto: ChangeStatusDto) {
    await this.findOne(tenantId, id);
    const patch: Partial<ServiceOrderEntity> = {};
    if (dto.statusId) patch.statusId = dto.statusId;
    if (dto.status)   patch.status   = dto.status as ServiceOrderEntity['status'];
    await this.repo.update({ id, tenantId }, patch);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }

  async buildPdfData(tenantId: string, id: string): Promise<OsPdfData> {
    const os = await this.findOne(tenantId, id);

    const [tenant] = await this.dataSource.query<{ name: string; phone?: string; cnpj?: string }[]>(
      `SELECT name, phone, cnpj FROM public.tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );

    const [client] = os.clientId
      ? await this.dataSource.query<{ name: string; phone?: string }[]>(
          `SELECT name, phone FROM public.clients WHERE id = $1 LIMIT 1`,
          [os.clientId],
        )
      : [null];

    let employeeName: string | undefined;
    if (os.employeeId) {
      const [emp] = await this.dataSource.query<{ name: string }[]>(
        `SELECT name FROM public.employees WHERE id = $1 LIMIT 1`,
        [os.employeeId],
      );
      employeeName = emp?.name;
    }

    const soItems = await this.dataSource.query<{
      description: string; quantity: string; unit_price: string; discount: string; total_price: string;
    }[]>(
      `SELECT description, quantity, unit_price, discount, total_price FROM public.so_items WHERE service_order_id = $1 ORDER BY sort_order`,
      [id],
    );

    const subtotal = soItems.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
    const total    = soItems.reduce((s, i) => s + Number(i.total_price), 0);

    return {
      tenant: { companyName: tenant?.name ?? 'Empresa', phone: tenant?.phone, cnpj: tenant?.cnpj },
      code: os.code,
      createdAt: os.createdAt,
      clientName: client?.name ?? 'Cliente',
      clientPhone: client?.phone,
      employeeName,
      description: os.description,
      items: soItems.map(i => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        discount: Number(i.discount),
        totalPrice: Number(i.total_price),
      })),
      subtotal,
      discountAmount: subtotal - total,
      total,
      warrantyUntil: os.warrantyUntil,
    };
  }
}
