import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { PurchaseOrderEntity } from './entities/purchase-order.entity';
import { PurchaseItemEntity } from './entities/purchase-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly repo: Repository<PurchaseOrderEntity>,
    @InjectRepository(PurchaseItemEntity)
    private readonly itemRepo: Repository<PurchaseItemEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string, status?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (status) where.status = status;
    return this.repo.find({ where, relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async findOne(tenantId: string, id: string) {
    const po = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['items'],
    });
    if (!po) throw new NotFoundException(`Pedido de compra ${id} não encontrado`);
    return po;
  }

  async create(tenantId: string, dto: CreatePurchaseOrderDto) {
    const code = `PC-${Date.now().toString(36).toUpperCase()}`;
    const discount = dto.discount ?? 0;
    const shippingCost = dto.shippingCost ?? 0;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const subtotal = dto.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
      const total = subtotal - discount + shippingCost;

      const po = qr.manager.create(PurchaseOrderEntity, {
        tenantId, code, supplierId: dto.supplierId,
        expectedAt: dto.expectedAt, discount, shippingCost,
        nfeNumber: dto.nfeNumber, notes: dto.notes,
        subtotal, total,
      });
      await qr.manager.save(po);

      const items = dto.items.map(i =>
        qr.manager.create(PurchaseItemEntity, {
          purchaseOrderId: po.id,
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          totalCost: i.quantity * i.unitCost,
        }),
      );
      await qr.manager.save(items);

      await qr.commitTransaction();
      return this.findOne(tenantId, po.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async update(tenantId: string, id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(tenantId, id);
    if (po.status !== 'draft') {
      throw new BadRequestException('Apenas pedidos em rascunho podem ser editados');
    }
    await this.repo.update({ id, tenantId }, dto as Partial<PurchaseOrderEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const po = await this.findOne(tenantId, id);
    if (!['draft', 'cancelled'].includes(po.status)) {
      throw new BadRequestException('Apenas pedidos em rascunho ou cancelados podem ser removidos');
    }
    await this.repo.softDelete({ id, tenantId });
  }

  async receive(tenantId: string, id: string, dto: ReceivePurchaseOrderDto) {
    const po = await this.findOne(tenantId, id);
    if (['received', 'cancelled'].includes(po.status)) {
      throw new BadRequestException('Pedido já foi completamente recebido ou cancelado');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      for (const { purchaseItemId, quantityReceived } of dto.items) {
        const item = po.items.find(i => i.id === purchaseItemId);
        if (!item) throw new NotFoundException(`Item ${purchaseItemId} não encontrado no pedido`);

        const newQtyReceived = Number(item.quantityReceived) + quantityReceived;
        if (newQtyReceived > Number(item.quantity)) {
          throw new BadRequestException(
            `Quantidade recebida (${newQtyReceived}) excede o pedido (${item.quantity}) para o item ${purchaseItemId}`,
          );
        }

        await qr.manager.update(PurchaseItemEntity, { id: purchaseItemId }, {
          quantityReceived: newQtyReceived,
        });

        // Criar stock_entry — campos conforme stock-entry.entity.ts existente
        await qr.query(
          `INSERT INTO public.stock_entries (tenant_id, product_id, type, quantity, observation)
           VALUES ($1, $2, 'in', $3, $4)`,
          [tenantId, item.productId, quantityReceived, `Recebimento ${po.code}`],
        );

        // Atualizar custo do produto
        await qr.query(
          `UPDATE public.products SET cost_price = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
          [item.unitCost, item.productId, tenantId],
        );
      }

      // Recarregar itens para verificar status
      const updatedItems = await qr.manager.find(PurchaseItemEntity, {
        where: { purchaseOrderId: id },
      });
      const allReceived = updatedItems.every(
        i => Number(i.quantityReceived) >= Number(i.quantity),
      );
      const anyReceived = updatedItems.some(i => Number(i.quantityReceived) > 0);

      const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : po.status;
      const patch: Partial<PurchaseOrderEntity> = { status: newStatus as any };
      if (allReceived) patch.receivedAt = new Date();
      await qr.manager.update(PurchaseOrderEntity, { id, tenantId }, patch);

      await qr.commitTransaction();
      return this.findOne(tenantId, id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
