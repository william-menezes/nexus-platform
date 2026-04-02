import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { QuoteItemEntity } from './quote-item.entity';

@Entity('quotes')
export class QuoteEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() code: string;
  @Column('uuid') clientId: string;
  @Column('uuid') statusId: string;
  @Column('uuid', { nullable: true }) employeeId?: string;
  @Column('uuid', { nullable: true }) equipmentId?: string;
  @Column({ nullable: true }) description?: string;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) subtotal: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) discountAmount: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) total: number;
  @Column({ nullable: true }) validUntil?: string;
  @Column('timestamptz', { nullable: true }) sentAt?: Date;
  @Column('timestamptz', { nullable: true }) approvedAt?: Date;
  @Column('timestamptz', { nullable: true }) rejectedAt?: Date;
  @Column({ nullable: true }) rejectionReason?: string;
  @Column('uuid', { nullable: true }) convertedToOsId?: string;
  @Column({ nullable: true }) notes?: string;
  @Column('jsonb', { default: {} }) customFields: Record<string, unknown>;
  @OneToMany(() => QuoteItemEntity, item => item.quote, { cascade: true, eager: false })
  items: QuoteItemEntity[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
