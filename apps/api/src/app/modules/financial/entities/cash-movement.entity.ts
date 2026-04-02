import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cash_movements')
export class CashMovementEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') cashSessionId: string;
  @Column() type: string;
  @Column('numeric', { precision: 10, scale: 2 }) amount: number;
  @Column() description: string;
  @Column('uuid', { nullable: true }) saleId?: string;
  @Column('uuid') createdBy: string;
  @CreateDateColumn() createdAt: Date;
}
