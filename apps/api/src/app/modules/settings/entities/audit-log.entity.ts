import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  userId: string;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column('jsonb', { nullable: true })
  oldData?: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  newData?: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
