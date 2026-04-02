import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('cost_centers')
export class CostCenterEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() name: string;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
