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

  @Column({ default: 'open' })
  status: 'open' | 'in_progress' | 'awaiting_parts' | 'done' | 'cancelled';

  @Column()
  clientName: string;

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
