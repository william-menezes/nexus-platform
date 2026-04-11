import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { PurchaseItemEntity } from './purchase-item.entity';

@Entity('purchase_orders')
export class PurchaseOrderEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() code: string;
  @Column('uuid') supplierId: string;
  @Column({ default: 'draft' }) status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) subtotal: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) discount: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) shippingCost: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) total: number;
  @Column('date', { nullable: true }) expectedAt?: string;
  @Column('timestamptz', { nullable: true }) receivedAt?: Date;
  @Column({ nullable: true }) nfeNumber?: string;
  @Column({ nullable: true }) notes?: string;
  @OneToMany(() => PurchaseItemEntity, i => i.purchaseOrder, { cascade: true, eager: false })
  items: PurchaseItemEntity[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
