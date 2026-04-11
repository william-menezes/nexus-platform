import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('contract_billing')
export class ContractBillingEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') contractId: string;
  @Column('date') periodStart: string;
  @Column('date') periodEnd: string;
  @Column('numeric', { precision: 10, scale: 2 }) baseAmount: number;
  @Column('numeric', { precision: 6, scale: 2, default: 0 }) excessHours: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) excessAmount: number;
  @Column('numeric', { precision: 10, scale: 2 }) totalAmount: number;
  @Column({ default: 'pending' }) status: 'pending' | 'billed' | 'paid' | 'cancelled';
  @Column('timestamptz', { nullable: true }) billedAt?: Date;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => ContractEntity, c => c.billings)
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;
}
