import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
} from 'typeorm';

export type ItemBrandType = 'product' | 'part';

@Entity('item_brands')
export class ItemBrandEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() itemType: ItemBrandType;
  @Column() name: string;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
