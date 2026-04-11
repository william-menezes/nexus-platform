import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { ContractBillingEntity } from './contract-billing.entity';

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() code: string;
  @Column('uuid') clientId: string;
  @Column() type: 'fixed' | 'hourly_franchise';
  @Column({ default: 'draft' }) status: 'draft' | 'active' | 'suspended' | 'cancelled' | 'expired';
  @Column({ nullable: true }) description?: string;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) monthlyValue?: number;
  @Column('numeric', { precision: 6, scale: 2, nullable: true }) franchiseHours?: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) hourExcessPrice?: number;
  @Column('date') startDate: string;
  @Column('date', { nullable: true }) endDate?: string;
  @Column({ default: 1 }) billingDay: number;
  @Column('numeric', { precision: 5, scale: 2, default: 0 }) adjustmentRate: number;
  @Column('date', { nullable: true }) lastAdjustment?: string;
  @Column('timestamptz', { nullable: true }) nextBillingAt?: Date;
  @Column({ nullable: true }) notes?: string;
  @OneToMany(() => ContractBillingEntity, b => b.contract)
  billings: ContractBillingEntity[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
