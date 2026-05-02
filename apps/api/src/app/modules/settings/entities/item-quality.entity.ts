import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
} from 'typeorm';

export type ItemQualityType = 'product' | 'part';

@Entity('item_qualities')
export class ItemQualityEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() itemType: ItemQualityType;
  @Column() name: string;
  @Column({ type: 'int', default: 99 }) level: number;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
