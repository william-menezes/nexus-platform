import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cash_sessions')
export class CashSessionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') cashRegisterId: string;
  @Column('uuid') openedBy: string;
  @Column('uuid', { nullable: true }) closedBy?: string;
  @Column('numeric', { precision: 10, scale: 2 }) openingAmount: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) closingAmount?: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) expectedAmount?: number;
  @Column('numeric', { precision: 10, scale: 2, nullable: true }) difference?: number;
  @Column({ default: 'open' }) status: string;
  @CreateDateColumn() openedAt: Date;
  @Column('timestamptz', { nullable: true }) closedAt?: Date;
  @Column({ nullable: true }) notes?: string;
}
