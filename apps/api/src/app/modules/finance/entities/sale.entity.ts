import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SaleItemEntity } from './sale-item.entity';
import { PaymentEntity } from './payment.entity';

@Entity('sales')
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  serviceOrderId?: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ default: 'open' })
  status: 'open' | 'paid' | 'cancelled';

  @OneToMany(() => SaleItemEntity, (item) => item.sale, { cascade: true, eager: false })
  items: SaleItemEntity[];

  @OneToMany(() => PaymentEntity, (p) => p.sale, { cascade: true, eager: false })
  payments: PaymentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
