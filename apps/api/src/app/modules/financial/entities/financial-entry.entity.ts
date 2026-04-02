import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { InstallmentEntity } from './installment.entity';

@Entity('financial_entries')
export class FinancialEntryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() type: string;
  @Column('uuid', { nullable: true }) accountId?: string;
  @Column('uuid', { nullable: true }) costCenterId?: string;
  @Column() description: string;
  @Column('numeric', { precision: 10, scale: 2 }) totalAmount: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) paidAmount: number;
  @Column({ default: 'pending' }) status: string;
  @Column('date') dueDate: string;
  @Column('timestamptz', { nullable: true }) paidAt?: Date;
  @Column('uuid', { nullable: true }) saleId?: string;
  @Column('uuid', { nullable: true }) contractId?: string;
  @Column({ default: false }) isRecurring: boolean;
  @Column({ nullable: true }) recurrenceRule?: string;
  @Column('uuid', { nullable: true }) parentEntryId?: string;
  @Column({ nullable: true }) entityType?: string;
  @Column('uuid', { nullable: true }) entityId?: string;
  @Column({ nullable: true }) entityName?: string;
  @Column({ nullable: true }) notes?: string;
  @OneToMany(() => InstallmentEntity, i => i.financialEntry, { cascade: true, eager: false })
  installments: InstallmentEntity[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
