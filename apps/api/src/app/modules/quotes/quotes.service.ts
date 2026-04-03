import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { QuoteEntity } from './entities/quote.entity';
import { QuoteItemEntity } from './entities/quote-item.entity';
import { CreateQuoteDto, QuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto, RejectQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(QuoteEntity)
    private readonly repo: Repository<QuoteEntity>,
    @InjectRepository(QuoteItemEntity)
    private readonly itemRepo: Repository<QuoteItemEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string, statusId?: string, clientId?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (statusId) where.statusId = statusId;
    if (clientId) where.clientId = clientId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(tenantId: string, id: string) {
    const q = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['items'],
    });
    if (!q) throw new NotFoundException(`Orçamento ${id} não encontrado`);
    return q;
  }

  async create(tenantId: string, dto: CreateQuoteDto) {
    const code = `ORC-${Date.now().toString(36).toUpperCase()}`;
    const items = (dto.items ?? []).map(this.buildItem);
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const discountAmount = dto.discountAmount ?? 0;
    const total = subtotal - discountAmount;

    // Resolve statusId: use provided or fall back to the default quote status (Rascunho)
    let statusId = dto.statusId;
    if (!statusId) {
      const [defaultStatus] = await this.dataSource.query<{ id: string }[]>(
        `SELECT id FROM public.custom_statuses
         WHERE tenant_id = $1 AND entity_type = 'quote' AND is_default = true AND deleted_at IS NULL
         LIMIT 1`,
        [tenantId],
      );
      if (defaultStatus) {
        statusId = defaultStatus.id;
      } else {
        throw new BadRequestException('Nenhum status padrão encontrado para orçamentos. Configure os status em Configurações.');
      }
    }

    const quote = this.repo.create({
      ...dto,
      statusId,
      tenantId,
      code,
      subtotal,
      discountAmount,
      total,
      items,
    });
    return this.repo.save(quote);
  }

  async update(tenantId: string, id: string, dto: UpdateQuoteDto) {
    const quote = await this.findOne(tenantId, id);

    if (dto.items !== undefined) {
      await this.itemRepo.delete({ quoteId: id });
      const items = dto.items.map(this.buildItem);
      const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
      const discountAmount = dto.discountAmount ?? quote.discountAmount;
      await this.repo.save({ ...quote, ...dto, subtotal, discountAmount, total: subtotal - discountAmount, items });
    } else {
      await this.repo.update({ id, tenantId }, dto as Partial<QuoteEntity>);
    }
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }

  async send(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, { sentAt: new Date() });
    return this.findOne(tenantId, id);
  }

  async approve(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, { approvedAt: new Date() });
    return this.findOne(tenantId, id);
  }

  async reject(tenantId: string, id: string, dto: RejectQuoteDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, { rejectedAt: new Date(), rejectionReason: dto.rejectionReason });
    return this.findOne(tenantId, id);
  }

  // RN06: Converter orçamento aprovado em OS
  async convertToOs(tenantId: string, quoteId: string) {
    const quote = await this.findOne(tenantId, quoteId);
    if (quote.convertedToOsId) {
      throw new BadRequestException('Orçamento já foi convertido em OS');
    }

    const osCode = `OS-${Date.now().toString(36).toUpperCase()}`;
    const [os] = await this.dataSource.query<{ id: string }[]>(
      `INSERT INTO public.service_orders (tenant_id, code, status, client_id, employee_id, description, custom_fields)
       VALUES ($1, $2, 'open', $3, $4, $5, '{}') RETURNING id`,
      [tenantId, osCode, quote.clientId, quote.employeeId ?? null, quote.description ?? ''],
    );

    for (const item of quote.items ?? []) {
      await this.dataSource.query(
        `INSERT INTO public.so_items
         (service_order_id, item_type, product_id, service_id, description, quantity, unit_price, discount, total_price, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [os.id, item.itemType, item.productId ?? null, item.serviceId ?? null,
         item.description, item.quantity, item.unitPrice, item.discount, item.totalPrice, item.sortOrder],
      );
    }

    await this.repo.update({ id: quoteId, tenantId }, { convertedToOsId: os.id });
    return this.findOne(tenantId, quoteId);
  }

  private buildItem(dto: QuoteItemDto): Partial<QuoteItemEntity> {
    const discount = dto.discount ?? 0;
    const totalPrice = dto.quantity * dto.unitPrice - discount;
    return { ...dto, discount, totalPrice, sortOrder: dto.sortOrder ?? 0 };
  }
}
