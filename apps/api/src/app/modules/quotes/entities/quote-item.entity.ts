import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { QuoteEntity } from './quote.entity';

@Entity('quote_items')
export class QuoteItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') quoteId: string;
  @Column() itemType: string;
  @Column('uuid', { nullable: true }) productId?: string;
  @Column('uuid', { nullable: true }) serviceId?: string;
  @Column() description: string;
  @Column('numeric', { precision: 10, scale: 3, default: 1 }) quantity: number;
  @Column('numeric', { precision: 10, scale: 2 }) unitPrice: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) discount: number;
  @Column('numeric', { precision: 10, scale: 2 }) totalPrice: number;
  @Column({ default: 0 }) sortOrder: number;
  @ManyToOne(() => QuoteEntity, q => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote: QuoteEntity;
}
