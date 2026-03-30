import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('tenant_settings')
export class TenantSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  tenantId: string;

  @Column({ type: 'int', default: 30 })
  quoteValidityDays: number;

  @Column({ type: 'int', default: 90 })
  warrantyDays: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ default: 'America/Sao_Paulo' })
  timezone: string;

  @Column({ default: 'OS' })
  osCodePrefix: string;

  @Column({ default: 'ORC' })
  quoteCodePrefix: string;

  @Column({ default: 'VND' })
  saleCodePrefix: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
