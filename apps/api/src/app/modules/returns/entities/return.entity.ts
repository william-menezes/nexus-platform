import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ReturnItemEntity } from './return-item.entity';

@Entity('returns')
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') saleId: string;
  @Column() code: string;
  @Column() type: 'refund' | 'credit' | 'exchange';
  @Column() reason: string;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) totalAmount: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) creditAmount: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) refundAmount: number;
  @Column({ default: 'pending' }) status: 'pending' | 'approved' | 'completed' | 'rejected';
  @Column('uuid', { nullable: true }) processedBy?: string;
  @Column({ nullable: true }) notes?: string;
  @OneToMany(() => ReturnItemEntity, i => i.return, { cascade: true, eager: false })
  items: ReturnItemEntity[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
