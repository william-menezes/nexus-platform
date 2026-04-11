import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ReturnEntity } from './return.entity';

@Entity('return_items')
export class ReturnItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') returnId: string;
  @ManyToOne(() => ReturnEntity, r => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_id' }) return: ReturnEntity;
  @Column('uuid') saleItemId: string;
  @Column('uuid', { nullable: true }) productId?: string;
  @Column('int') quantity: number;
  @Column('numeric', { precision: 10, scale: 2 }) unitPrice: number;
  @Column('numeric', { precision: 10, scale: 2 }) totalPrice: number;
  @Column('uuid', { nullable: true }) exchangeProductId?: string;
  @Column('int', { nullable: true }) exchangeQuantity?: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) exchangeUnitPrice?: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) exchangeTotal?: number;
  @Column({ default: false }) stockReturned: boolean;
}
