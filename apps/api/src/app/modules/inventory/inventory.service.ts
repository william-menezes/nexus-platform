import {
  Injectable, NotFoundException, UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProductEntity, ProductType } from './entities/product.entity';
import { StockEntryEntity } from './entities/stock-entry.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(StockEntryEntity)
    private readonly entries: Repository<StockEntryEntity>,
  ) {}

  findAllProducts(tenantId: string, type?: ProductType, activeOnly = false) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (type) where.type = type;
    if (activeOnly) where.isActive = true;
    return this.products
      .find({ where, order: { name: 'ASC' }, relations: ['category', 'brand', 'quality'] })
      .then(list => list.map(p => ({ ...p, belowMinStock: p.currentStock < p.minStock })));
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const results = await this.products.find({
      where: { tenantId, barcode, deletedAt: IsNull() } as any,
      relations: ['category', 'brand', 'quality'],
      take: 1,
    });
    if (!results.length) throw new NotFoundException(`Produto com código '${barcode}' não encontrado`);
    const p = results[0];
    return { ...p, belowMinStock: p.currentStock < p.minStock };
  }

  async findOneProduct(tenantId: string, id: string) {
    const p = await this.products.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['category', 'brand', 'quality'],
    });
    if (!p) throw new NotFoundException(`Produto ${id} não encontrado`);
    return { ...p, belowMinStock: p.currentStock < p.minStock };
  }

  createProduct(tenantId: string, dto: CreateProductDto) {
    return this.products.save({ ...dto, tenantId, currentStock: 0 });
  }

  async updateProduct(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOneProduct(tenantId, id);
    await this.products.update({ id, tenantId }, dto as Partial<ProductEntity>);
    return this.findOneProduct(tenantId, id);
  }

  async removeProduct(tenantId: string, id: string) {
    await this.findOneProduct(tenantId, id);
    await this.products.softDelete({ id, tenantId });
  }

  findEntries(tenantId: string, productId: string) {
    return this.entries.find({
      where: { tenantId, productId },
      order: { createdAt: 'DESC' },
    });
  }

  async createEntry(tenantId: string, dto: CreateStockEntryDto) {
    const product = await this.findOneProduct(tenantId, dto.productId);

    if (dto.type === 'out' && product.currentStock < dto.quantity) {
      throw new UnprocessableEntityException(
        `Estoque insuficiente: disponível ${product.currentStock}, solicitado ${dto.quantity}`,
      );
    }

    const entry = await this.entries.save({ ...dto, tenantId });

    if (dto.costPrice !== undefined && dto.type === 'in') {
      await this.products.update({ id: dto.productId, tenantId }, { costPrice: dto.costPrice });
    }

    return entry;
  }
}
