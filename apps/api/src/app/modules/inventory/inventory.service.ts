import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
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

  findAllProducts(tenantId: string) {
    return this.products.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findOneProduct(tenantId: string, id: string) {
    const p = await this.products.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!p) throw new NotFoundException(`Produto ${id} não encontrado`);
    return p;
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
    await this.findOneProduct(tenantId, dto.productId);
    return this.entries.save({ ...dto, tenantId });
  }
}
