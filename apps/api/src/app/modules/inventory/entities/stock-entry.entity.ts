import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_entries')
export class StockEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  productId: string;

  @Column('uuid', { nullable: true })
  serviceOrderId?: string;

  @Column()
  type: 'in' | 'out';

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  nfeNumber?: string;

  @Column({ nullable: true })
  observation?: string;

  @CreateDateColumn()
  createdAt: Date;
}
