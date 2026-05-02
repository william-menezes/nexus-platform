import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ItemCategoryEntity } from '../../settings/entities/item-category.entity';

@Entity('services')
export class ServiceCatalogEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() name: string;
  @Column({ nullable: true }) description?: string;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) defaultPrice: number;
  @Column('numeric', { precision: 5, scale: 2, nullable: true }) estimatedHours?: number;
  @Column({ nullable: true }) categoryId?: string;
  @ManyToOne(() => ItemCategoryEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'category_id' })
  category?: ItemCategoryEntity;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
