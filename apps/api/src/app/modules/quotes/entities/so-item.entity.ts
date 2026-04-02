import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('so_items')
export class SoItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') serviceOrderId: string;
  @Column() itemType: string;
  @Column('uuid', { nullable: true }) productId?: string;
  @Column('uuid', { nullable: true }) serviceId?: string;
  @Column() description: string;
  @Column('numeric', { precision: 10, scale: 3, default: 1 }) quantity: number;
  @Column('numeric', { precision: 10, scale: 2 }) unitPrice: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) discount: number;
  @Column('numeric', { precision: 10, scale: 2 }) totalPrice: number;
  @Column({ default: 0 }) sortOrder: number;
}
