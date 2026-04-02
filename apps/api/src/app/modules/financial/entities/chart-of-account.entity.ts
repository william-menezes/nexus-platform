import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('chart_of_accounts')
export class ChartOfAccountEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() code: string;
  @Column() name: string;
  @Column() type: string;
  @Column('uuid', { nullable: true }) parentId?: string;
  @Column({ default: false }) isSystem: boolean;
  @Column({ default: true }) isActive: boolean;
  @Column({ default: 0 }) sortOrder: number;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
