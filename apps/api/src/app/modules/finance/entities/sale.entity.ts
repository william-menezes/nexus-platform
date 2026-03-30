import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
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

  @Column({ nullable: true })
  code?: string;

  @Column('uuid', { nullable: true })
  serviceOrderId?: string;

  // Phase 1 refactor: FK to clients
  @Column('uuid', { nullable: true })
  clientId?: string;

  // Phase 1 refactor: FK to custom_statuses
  @Column('uuid', { nullable: true })
  statusId?: string;

  // Phase 1 refactor: FK to employees
  @Column('uuid', { nullable: true })
  employeeId?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  // Legacy string status (kept for backward compat)
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

  @DeleteDateColumn()
  deletedAt?: Date;
}
