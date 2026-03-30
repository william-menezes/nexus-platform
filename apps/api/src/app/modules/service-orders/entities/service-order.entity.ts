import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('service_orders')
export class ServiceOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  code: string;

  // Legacy string status (kept for backward compat — migrate to status_id)
  @Column({ default: 'open' })
  status: 'open' | 'in_progress' | 'awaiting_parts' | 'done' | 'cancelled';

  // Phase 1 refactor: FK to custom_statuses
  @Column('uuid', { nullable: true })
  statusId?: string;

  // Phase 1 refactor: FK to clients
  @Column('uuid', { nullable: true })
  clientId?: string;

  // Phase 1 refactor: FK to employees
  @Column('uuid', { nullable: true })
  employeeId?: string;

  // Legacy client fields (kept for backward compat)
  @Column({ nullable: true })
  clientName?: string;

  @Column({ nullable: true })
  clientPhone?: string;

  @Column('text')
  description: string;

  @Column('jsonb', { default: {} })
  customFields: Record<string, unknown>;

  @Column('numeric', { nullable: true, precision: 10, scale: 2 })
  priceIdeal?: number;

  @Column('numeric', { nullable: true, precision: 10, scale: 2 })
  priceEffective?: number;

  @Column('timestamptz', { nullable: true })
  deliveredAt?: Date;

  @Column('timestamptz', { nullable: true })
  warrantyUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
