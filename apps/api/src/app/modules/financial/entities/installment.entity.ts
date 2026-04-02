import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { FinancialEntryEntity } from './financial-entry.entity';

@Entity('installments')
export class InstallmentEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') financialEntryId: string;
  @Column() installmentNumber: number;
  @Column('numeric', { precision: 10, scale: 2 }) amount: number;
  @Column('date') dueDate: string;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) paidAmount: number;
  @Column('timestamptz', { nullable: true }) paidAt?: Date;
  @Column({ default: 'pending' }) status: string;
  @Column({ nullable: true }) paymentMethod?: string;
  @Column({ nullable: true }) notes?: string;
  @ManyToOne(() => FinancialEntryEntity, e => e.installments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'financial_entry_id' })
  financialEntry: FinancialEntryEntity;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
