import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrderEntity } from './purchase-order.entity';

@Entity('purchase_items')
export class PurchaseItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') purchaseOrderId: string;
  @Column('uuid') productId: string;
  @Column('numeric', { precision: 10, scale: 3 }) quantity: number;
  @Column('numeric', { precision: 10, scale: 2 }) unitCost: number;
  @Column('numeric', { precision: 10, scale: 2 }) totalCost: number;
  @Column('numeric', { precision: 10, scale: 3, default: 0 }) quantityReceived: number;
  @ManyToOne(() => PurchaseOrderEntity, po => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' }) purchaseOrder: PurchaseOrderEntity;
}
