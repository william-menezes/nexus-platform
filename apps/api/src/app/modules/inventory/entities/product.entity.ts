import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku?: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  costPrice: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  externalRef?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
