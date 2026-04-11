import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReturnEntity } from './entities/return.entity';
import { ReturnItemEntity } from './entities/return-item.entity';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnEntity)
    private readonly repo: Repository<ReturnEntity>,
    @InjectRepository(ReturnItemEntity)
    private readonly itemRepo: Repository<ReturnItemEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string, filters?: { status?: string; saleId?: string }) {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.saleId) where.saleId = filters.saleId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(tenantId: string, id: string) {
    const ret = await this.repo.findOne({
      where: { tenantId, id },
      relations: ['items'],
    });
    if (!ret) throw new NotFoundException(`Devolução ${id} não encontrada`);
    return ret;
  }

  async create(tenantId: string, dto: CreateReturnDto) {
    // Verificar que a venda pertence ao tenant
    const [sale] = await this.dataSource.query<{ id: string }[]>(
      `SELECT id FROM public.sales WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [dto.saleId, tenantId],
    );
    if (!sale) throw new NotFoundException(`Venda ${dto.saleId} não encontrada`);

    const code = `DEV-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = dto.items.reduce((s, i) => s + i.totalPrice, 0);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const returnEntity = qr.manager.create(ReturnEntity, {
        tenantId,
        saleId: dto.saleId,
        code,
        type: dto.type,
        reason: dto.reason,
        notes: dto.notes,
        totalAmount,
        status: 'pending',
      });
      await qr.manager.save(returnEntity);

      const items = dto.items.map(i =>
        qr.manager.create(ReturnItemEntity, { ...i, returnId: returnEntity.id }),
      );
      await qr.manager.save(items);

      await qr.commitTransaction();
      return this.findOne(tenantId, returnEntity.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async approve(tenantId: string, id: string) {
    const ret = await this.findOne(tenantId, id);
    if (ret.status !== 'pending') {
      throw new BadRequestException('Apenas devoluções pendentes podem ser aprovadas');
    }
    // Itens NÃO voltam ao estoque automaticamente — requer confirmação manual via returnToStock
    await this.repo.update({ id, tenantId }, { status: 'approved' });
    return this.findOne(tenantId, id);
  }

  async reject(tenantId: string, id: string, reason: string) {
    const ret = await this.findOne(tenantId, id);
    if (ret.status !== 'pending') {
      throw new BadRequestException('Apenas devoluções pendentes podem ser rejeitadas');
    }
    await this.repo.update({ id, tenantId }, { status: 'rejected', notes: reason });
    return this.findOne(tenantId, id);
  }

  async returnToStock(tenantId: string, returnId: string, itemId: string) {
    const ret = await this.findOne(tenantId, returnId);
    if (ret.status !== 'approved') {
      throw new BadRequestException('A devolução precisa estar aprovada para retornar itens ao estoque');
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId, returnId } });
    if (!item) throw new NotFoundException(`Item ${itemId} não encontrado na devolução`);
    if (item.stockReturned) throw new BadRequestException('Este item já foi retornado ao estoque');
    if (!item.productId) throw new BadRequestException('Item não possui produto vinculado');

    // Inserir stock_entry com os campos que a tabela existente espera
    await this.dataSource.query(
      `INSERT INTO public.stock_entries (tenant_id, product_id, type, quantity, observation)
       VALUES ($1, $2, 'in', $3, $4)`,
      [tenantId, item.productId, item.quantity, `Devolução ${ret.code}`],
    );

    await this.itemRepo.update({ id: itemId }, { stockReturned: true });

    // Verificar se todos os itens com produto foram retornados → marca como completed
    const [pending] = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*) AS count FROM public.return_items
       WHERE return_id = $1 AND product_id IS NOT NULL AND stock_returned = false`,
      [returnId],
    );
    if (Number(pending.count) === 0) {
      await this.repo.update({ id: returnId }, { status: 'completed' });
    }

    return this.findOne(tenantId, returnId);
  }
}
