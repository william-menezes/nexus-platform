import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

export type ItemCategoryType = 'product' | 'part' | 'service';

@Entity('item_categories')
export class ItemCategoryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() itemType: ItemCategoryType;
  @Column() name: string;
  @Column({ nullable: true }) description?: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
