import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ItemCategoryEntity, ItemCategoryType } from './entities/item-category.entity';
import { ItemBrandEntity, ItemBrandType } from './entities/item-brand.entity';
import { ItemQualityEntity, ItemQualityType } from './entities/item-quality.entity';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { CreateItemBrandDto } from './dto/create-item-brand.dto';
import { CreateItemQualityDto } from './dto/create-item-quality.dto';

@Injectable()
export class CatalogSettingsService {
  constructor(
    @InjectRepository(ItemCategoryEntity)
    private readonly categories: Repository<ItemCategoryEntity>,
    @InjectRepository(ItemBrandEntity)
    private readonly brands: Repository<ItemBrandEntity>,
    @InjectRepository(ItemQualityEntity)
    private readonly qualities: Repository<ItemQualityEntity>,
  ) {}

  // ── Categories ────────────────────────────────────────────

  findCategories(tenantId: string, itemType: ItemCategoryType) {
    return this.categories.find({
      where: { tenantId, itemType, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  createCategory(tenantId: string, dto: CreateItemCategoryDto) {
    return this.categories.save({ ...dto, tenantId });
  }

  async updateCategory(tenantId: string, id: string, dto: Partial<CreateItemCategoryDto>) {
    const entity = await this.categories.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Categoria ${id} não encontrada`);
    await this.categories.update({ id, tenantId }, dto as Partial<ItemCategoryEntity>);
    return this.categories.findOne({ where: { id } });
  }

  async deleteCategory(tenantId: string, id: string) {
    const entity = await this.categories.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Categoria ${id} não encontrada`);
    await this.assertCategoryNotInUse(tenantId, id);
    await this.categories.softDelete({ id, tenantId });
  }

  private async assertCategoryNotInUse(tenantId: string, id: string) {
    const qr = this.categories.manager.connection.createQueryRunner();
    try {
      const [{ count }] = await qr.query(
        `SELECT COUNT(*)::int as count FROM products WHERE tenant_id=$1 AND category_id=$2 AND deleted_at IS NULL
         UNION ALL
         SELECT COUNT(*)::int FROM services WHERE tenant_id=$1 AND category_id=$2 AND deleted_at IS NULL`,
        [tenantId, id],
      );
      if (count > 0) {
        throw new ConflictException('Categoria está em uso por produtos ou serviços e não pode ser removida');
      }
    } finally {
      await qr.release();
    }
  }

  // ── Brands ────────────────────────────────────────────────

  findBrands(tenantId: string, itemType: ItemBrandType) {
    return this.brands.find({
      where: { tenantId, itemType, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  createBrand(tenantId: string, dto: CreateItemBrandDto) {
    return this.brands.save({ ...dto, tenantId });
  }

  async updateBrand(tenantId: string, id: string, dto: Partial<CreateItemBrandDto>) {
    const entity = await this.brands.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Marca ${id} não encontrada`);
    await this.brands.update({ id, tenantId }, dto as Partial<ItemBrandEntity>);
    return this.brands.findOne({ where: { id } });
  }

  async deleteBrand(tenantId: string, id: string) {
    const entity = await this.brands.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Marca ${id} não encontrada`);
    const inUse = await this.brands.manager.getRepository('products')
      .count({ where: { tenantId, brandId: id } } as any);
    if (inUse > 0) {
      throw new ConflictException('Marca está em uso por produtos ou peças e não pode ser removida');
    }
    await this.brands.softDelete({ id, tenantId });
  }

  // ── Qualities ─────────────────────────────────────────────

  findQualities(tenantId: string, itemType: ItemQualityType) {
    return this.qualities.find({
      where: { tenantId, itemType, deletedAt: IsNull() },
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  createQuality(tenantId: string, dto: CreateItemQualityDto) {
    return this.qualities.save({ ...dto, tenantId });
  }

  async updateQuality(tenantId: string, id: string, dto: Partial<CreateItemQualityDto>) {
    const entity = await this.qualities.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Qualidade ${id} não encontrada`);
    await this.qualities.update({ id, tenantId }, dto as Partial<ItemQualityEntity>);
    return this.qualities.findOne({ where: { id } });
  }

  async deleteQuality(tenantId: string, id: string) {
    const entity = await this.qualities.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!entity) throw new NotFoundException(`Qualidade ${id} não encontrada`);
    const inUse = await this.qualities.manager.getRepository('products')
      .count({ where: { tenantId, qualityId: id } } as any);
    if (inUse > 0) {
      throw new ConflictException('Qualidade está em uso por produtos ou peças e não pode ser removida');
    }
    await this.qualities.softDelete({ id, tenantId });
  }
}
