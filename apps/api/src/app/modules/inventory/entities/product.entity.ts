import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ItemCategoryEntity } from '../../settings/entities/item-category.entity';
import { ItemBrandEntity } from '../../settings/entities/item-brand.entity';
import { ItemQualityEntity } from '../../settings/entities/item-quality.entity';

export type ProductType = 'product' | 'part';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'product' })
  type: ProductType;

  @Column({ nullable: true })
  sku?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'un' })
  unit: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  costPrice: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => ItemCategoryEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'category_id' })
  category?: ItemCategoryEntity;

  @Column({ nullable: true })
  brandId?: string;

  @ManyToOne(() => ItemBrandEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand?: ItemBrandEntity;

  @Column({ nullable: true })
  qualityId?: string;

  @ManyToOne(() => ItemQualityEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'quality_id' })
  quality?: ItemQualityEntity;

  @Column('uuid', { nullable: true })
  supplierId?: string;

  @Column({ nullable: true })
  externalRef?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
