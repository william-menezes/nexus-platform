import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SaleEntity } from './sale.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => SaleEntity, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: SaleEntity;

  @Column()
  method: 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';

  @Column('numeric', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  asaasChargeId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
